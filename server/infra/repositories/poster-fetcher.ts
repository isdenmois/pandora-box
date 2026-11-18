import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'
import { extensionFromContentType, type ImageExtension, isImageSource } from '@/domain'

export interface DownloadedPoster {
  bytes: Uint8Array
  extension: ImageExtension
  contentType: string
}

export class PosterDownloadError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PosterDownloadError'
  }
}

const ATTEMPTS = 3
const BACKOFF_MS = [250, 1000]
const ATTEMPT_TIMEOUT_MS = 4000
const TOTAL_TIMEOUT_MS = 10_000
const MAX_REDIRECTS = 3
const CONCURRENCY = 3
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308])

/** MIME types we are willing to store; the extension is derived from this list only. */
const END_MARKERS: Partial<Record<ImageExtension, Uint8Array>> = {
  jpg: new Uint8Array([0xff, 0xd9]),
  png: new Uint8Array([0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]),
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export function isPrivateAddress(address: string): boolean {
  if (isIP(address) === 4) {
    const [a, b] = address.split('.').map(Number)

    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224
    )
  }

  const normalized = address.toLowerCase()

  return (
    normalized === '::' ||
    normalized === '::1' ||
    normalized.startsWith('fe80:') ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    normalized.startsWith('::ffff:')
  )
}

/** Rejects anything that is not a public http(s) endpoint; runs again on every redirect hop. */
export async function assertFetchable(rawUrl: string): Promise<URL> {
  if (!isImageSource(rawUrl)) {
    throw new PosterDownloadError(`Unsupported URL: ${rawUrl}`)
  }

  const url = new URL(rawUrl)
  const host = url.hostname.replace(/^\[|\]$/g, '')

  if (!host || host === 'localhost' || host.endsWith('.localhost')) {
    throw new PosterDownloadError(`Refusing local host: ${host}`)
  }

  const addresses = isIP(host) ? [{ address: host }] : await lookup(host, { all: true })

  if (!addresses.length) {
    throw new PosterDownloadError(`Cannot resolve host: ${host}`)
  }

  if (addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new PosterDownloadError(`Refusing private address for ${host}`)
  }

  return url
}

export function hasEndMarker(bytes: Uint8Array, extension: ImageExtension): boolean {
  const marker = END_MARKERS[extension]

  if (!marker) {
    return true
  }

  if (bytes.length < marker.length) {
    return false
  }

  const tail = bytes.subarray(bytes.length - marker.length)

  return marker.every((byte, index) => tail[index] === byte)
}

type Decoder = (bytes: Uint8Array) => Promise<void>

interface BunImage {
  metadata(): Promise<unknown>
}

/**
 * A truncated JPEG still decodes, so the end marker is the real guard; this catches payloads
 * that are not an image at all (an HTML error page with an image content-type, for example).
 * `Bun.Image` only exists under the Bun runtime, so unit tests pass their own decoder.
 */
async function decodeWithBun(bytes: Uint8Array): Promise<void> {
  const Image = (globalThis as { Bun?: { Image?: new (input: Uint8Array) => BunImage } }).Bun?.Image

  if (!Image) {
    return
  }

  try {
    await new Image(bytes).metadata()
  } catch {
    throw new PosterDownloadError('Downloaded bytes are not a decodable image')
  }
}

async function fetchOnce(url: URL, deadline: number): Promise<Response> {
  let current = url

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const remaining = Math.min(ATTEMPT_TIMEOUT_MS, deadline - Date.now())

    if (remaining <= 0) {
      throw new PosterDownloadError('Timed out')
    }

    const response = await fetch(current, {
      redirect: 'manual',
      signal: AbortSignal.timeout(remaining),
      headers: {
        'user-agent':
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        accept: 'image/jpeg,image/png,image/webp,image/gif,image/avif,*/*;q=0.8',
      },
    })

    if (!REDIRECT_STATUSES.has(response.status)) {
      return response
    }

    const location = response.headers.get('location')

    await response.body?.cancel()

    if (!location) {
      throw new PosterDownloadError('Redirect without a location')
    }

    current = await assertFetchable(new URL(location, current).toString())
  }

  throw new PosterDownloadError('Too many redirects')
}

async function readBody(response: Response, maxBytes: number): Promise<Uint8Array> {
  if (!response.body) {
    throw new PosterDownloadError('Empty response body')
  }

  const declared = Number(response.headers.get('content-length'))
  const hasDeclaredLength = Number.isFinite(declared) && declared >= 0

  if (hasDeclaredLength && declared > maxBytes) {
    throw new PosterDownloadError(`Poster is larger than ${maxBytes} bytes`)
  }

  const chunks: Uint8Array[] = []
  let received = 0

  // Enforced while streaming: a missing content-length cannot bypass the cap.
  for await (const chunk of response.body) {
    received += chunk.byteLength

    if (received > maxBytes) {
      throw new PosterDownloadError(`Poster is larger than ${maxBytes} bytes`)
    }

    chunks.push(chunk)
  }

  if (hasDeclaredLength && received !== declared) {
    throw new PosterDownloadError(`Truncated body: ${received} of ${declared} bytes`)
  }

  if (!received) {
    throw new PosterDownloadError('Empty response body')
  }

  return new Uint8Array(Buffer.concat(chunks))
}

async function downloadAttempt(
  source: string,
  maxBytes: number,
  deadline: number,
  decode: Decoder,
): Promise<DownloadedPoster> {
  const url = await assertFetchable(source)
  const response = await fetchOnce(url, deadline)

  if (!response.ok) {
    await response.body?.cancel()
    throw new PosterDownloadError(`HTTP ${response.status}`)
  }

  const declaredType = response.headers.get('content-type')
  const extension = extensionFromContentType(declaredType)

  if (!extension) {
    await response.body?.cancel()
    throw new PosterDownloadError(`Not an image: ${declaredType ?? 'unknown content-type'}`)
  }

  const bytes = await readBody(response, maxBytes)

  if (!hasEndMarker(bytes, extension)) {
    throw new PosterDownloadError(`Truncated ${extension} payload`)
  }

  await decode(bytes)

  return { bytes, extension, contentType: `image/${extension}` }
}

let active = 0
const waiting: (() => void)[] = []

async function withSlot<T>(fn: () => Promise<T>): Promise<T> {
  if (active < CONCURRENCY) {
    active++
  } else {
    await new Promise<void>((resolve) => waiting.push(resolve))
  }

  try {
    return await fn()
  } finally {
    active--

    const next = waiting.shift()

    if (next) {
      active++
      next()
    }
  }
}

export const FAILURE_TTL_MS = 10 * 60 * 1000
export const FETCH_LIMITS = { ATTEMPTS, BACKOFF_MS, ATTEMPT_TIMEOUT_MS, TOTAL_TIMEOUT_MS, MAX_REDIRECTS, CONCURRENCY }

export interface PosterFetcher {
  download(source: string): Promise<DownloadedPoster>
  isFailing(source: string): boolean
  reset(): void
}

export interface PosterFetcherOptions {
  maxBytes: number
  enabled: boolean
  now?: () => number
  /** Overridable so tests can run without `Bun.Image`. */
  decode?: Decoder
  /** Overridable so tests do not wait out the real backoff. */
  sleep?: (ms: number) => Promise<void>
}

export function createPosterFetcher(options: PosterFetcherOptions): PosterFetcher {
  const now = options.now ?? Date.now
  const decode = options.decode ?? decodeWithBun
  const wait = options.sleep ?? sleep
  const inflight = new Map<string, Promise<DownloadedPoster>>()
  const failedAt = new Map<string, number>()

  const download = async (source: string): Promise<DownloadedPoster> => {
    if (!options.enabled) {
      throw new PosterDownloadError('Image fetching is disabled')
    }

    if (isFailing(source)) {
      throw new PosterDownloadError('Recently failed')
    }

    const running = inflight.get(source)

    if (running) {
      return await running
    }

    const task = withSlot(async () => {
      const deadline = now() + TOTAL_TIMEOUT_MS
      let lastError: unknown = new PosterDownloadError('Unknown error')

      for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
        try {
          const result = await downloadAttempt(source, options.maxBytes, deadline, decode)

          failedAt.delete(source)

          return result
        } catch (error) {
          lastError = error
          failedAt.set(source, now())

          const backoff = BACKOFF_MS[attempt]

          if (!backoff || now() + backoff >= deadline) {
            break
          }

          await wait(backoff)
        }
      }

      throw lastError instanceof Error ? lastError : new PosterDownloadError(String(lastError))
    })

    inflight.set(source, task)

    try {
      return await task
    } finally {
      inflight.delete(source)
    }
  }

  function isFailing(source: string): boolean {
    const failure = failedAt.get(source)

    if (failure === undefined) {
      return false
    }

    if (now() - failure >= FAILURE_TTL_MS) {
      failedAt.delete(source)

      return false
    }

    return true
  }

  return {
    download,
    isFailing,
    reset() {
      failedAt.clear()
      inflight.clear()
    },
  }
}
