import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPosterFetcher, FAILURE_TTL_MS, FETCH_LIMITS, hasEndMarker, isPrivateAddress } from '../poster-fetcher'

const JPEG_END = [0xff, 0xd9]
const PADDING = new Uint8Array([0x01, 0x02, 0x03, 0x04])

const jpeg = (extra = 0) => new Uint8Array([...PADDING, ...new Uint8Array(extra), ...JPEG_END])

/**
 * A Response body can only be read once, so every attempt needs its own instance;
 * `respondWith` builds a fresh one per call.
 */
const respondWith = (build: () => Response) => {
  const fetchMock = vi.fn(async () => build())

  vi.stubGlobal('fetch', fetchMock)

  return fetchMock
}

/** The fetcher resolves hosts via dns.lookup; tests replace fetch and stay off the network. */
const okResponse = (bytes: Uint8Array, contentType = 'image/jpeg') =>
  new Response(bytes as unknown as BodyInit, {
    status: 200,
    headers: { 'content-type': contentType, 'content-length': String(bytes.length) },
  })

const createFetcher = (overrides: Partial<Parameters<typeof createPosterFetcher>[0]> = {}) =>
  createPosterFetcher({
    maxBytes: 1024,
    enabled: true,
    decode: async () => {},
    sleep: async () => {},
    ...overrides,
  })

const source = 'https://93.184.216.34/poster.jpg'

describe('poster fetcher guardrails', () => {
  it('blocks private and loopback addresses', () => {
    // assert
    for (const address of ['127.0.0.1', '10.1.2.3', '192.168.0.1', '172.16.0.1', '169.254.1.1', '::1', 'fd00::1']) {
      expect(isPrivateAddress(address), address).toBe(true)
    }

    for (const address of ['93.184.216.34', '8.8.8.8', '2606:4700::1111']) {
      expect(isPrivateAddress(address), address).toBe(false)
    }
  })

  it('detects missing end markers', () => {
    // assert
    expect(hasEndMarker(jpeg(), 'jpg')).toBe(true)
    expect(hasEndMarker(new Uint8Array([0xff, 0x00]), 'jpg')).toBe(false)
    // Formats without a known marker are not rejected by this check.
    expect(hasEndMarker(new Uint8Array([0x00]), 'webp')).toBe(true)
  })
})

describe('createPosterFetcher', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('returns bytes and the extension derived from the content type', async () => {
    // arrange
    respondWith(() => okResponse(jpeg(10)))
    const fetcher = createFetcher()

    // act
    const result = await fetcher.download(source)

    // assert
    expect(result.extension).toBe('jpg')
    expect(result.bytes.length).toBe(16)
  })

  it('rejects a non-image content type', async () => {
    // arrange
    respondWith(() => okResponse(new Uint8Array([1, 2, 3]), 'text/html'))
    const fetcher = createFetcher()

    // act + assert
    await expect(fetcher.download(source)).rejects.toThrow(/Not an image/)
  })

  it('rejects a body that declares more bytes than it sent', async () => {
    // arrange
    respondWith(
      () =>
        new Response(jpeg() as unknown as BodyInit, {
          status: 200,
          headers: { 'content-type': 'image/jpeg', 'content-length': '9999' },
        }),
    )
    const fetcher = createFetcher({ maxBytes: 100_000 })

    // act + assert
    // Truncation is caught by the length mismatch, not by decoding: a cut JPEG still decodes.
    await expect(fetcher.download(source)).rejects.toThrow(/Truncated body/)
  })

  it('rejects a body without the jpeg end marker', async () => {
    // arrange
    respondWith(() => okResponse(new Uint8Array([...PADDING, 0xff])))
    const fetcher = createFetcher()

    // act + assert
    await expect(fetcher.download(source)).rejects.toThrow(/Truncated jpg/)
  })

  it('enforces the size cap on a body without content-length', async () => {
    // arrange
    respondWith(
      () =>
        new Response(new Uint8Array(500) as unknown as BodyInit, {
          status: 200,
          headers: { 'content-type': 'image/jpeg' },
        }),
    )
    const fetcher = createFetcher({ maxBytes: 100 })

    // act + assert
    await expect(fetcher.download(source)).rejects.toThrow(/larger than 100 bytes/)
  })

  it('retries a failing request and succeeds', async () => {
    // arrange
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 500 }))
      .mockResolvedValueOnce(okResponse(jpeg()))
    vi.stubGlobal('fetch', fetchMock)
    const fetcher = createFetcher()

    // act
    const result = await fetcher.download(source)

    // assert
    expect(result.extension).toBe('jpg')
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2)
  })

  it('gives up after the configured number of attempts and remembers the failure', async () => {
    // arrange
    respondWith(() => new Response(null, { status: 503 }))
    const fetcher = createFetcher()

    // act
    await expect(fetcher.download(source)).rejects.toThrow(/HTTP 503/)

    // assert
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(FETCH_LIMITS.ATTEMPTS)
    expect(fetcher.isFailing(source)).toBe(true)
  })

  it('stops remembering a failure once the ttl elapses', async () => {
    // arrange
    let clock = 0
    respondWith(() => new Response(null, { status: 503 }))
    const fetcher = createFetcher({ now: () => clock })

    await expect(fetcher.download(source)).rejects.toThrow()
    expect(fetcher.isFailing(source)).toBe(true)

    // act
    clock += FAILURE_TTL_MS

    // assert
    expect(fetcher.isFailing(source)).toBe(false)
  })

  it('does not download while a failure is remembered', async () => {
    // arrange
    respondWith(() => new Response(null, { status: 503 }))
    const fetcher = createFetcher()
    await expect(fetcher.download(source)).rejects.toThrow()
    const callsBefore = vi.mocked(fetch).mock.calls.length

    // act + assert
    await expect(fetcher.download(source)).rejects.toThrow(/Recently failed/)
    expect(vi.mocked(fetch).mock.calls.length).toBe(callsBefore)
  })

  it('shares one request between concurrent callers', async () => {
    // arrange
    respondWith(() => okResponse(jpeg()))
    const fetcher = createFetcher()

    // act
    const [first, second] = await Promise.all([fetcher.download(source), fetcher.download(source)])

    // assert
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1)
    expect(first.bytes.length).toBe(second.bytes.length)
  })

  it('refuses to fetch when disabled', async () => {
    // arrange
    const fetcher = createFetcher({ enabled: false })

    // act + assert
    await expect(fetcher.download(source)).rejects.toThrow(/disabled/)
    expect(vi.mocked(fetch)).not.toHaveBeenCalled()
  })

  it('refuses a loopback source before any request', async () => {
    // arrange
    const fetcher = createFetcher()

    // act + assert
    await expect(fetcher.download('http://127.0.0.1/poster.jpg')).rejects.toThrow(/local host|private/)
    expect(vi.mocked(fetch)).not.toHaveBeenCalled()
  })

  it('rejects a non-http source', async () => {
    // arrange
    const fetcher = createFetcher()

    // act + assert
    await expect(fetcher.download('file:///etc/passwd')).rejects.toThrow(/Unsupported URL/)
  })

  it('re-validates every redirect hop', async () => {
    // arrange
    respondWith(
      () => new Response(null, { status: 302, headers: { location: 'http://169.254.169.254/latest/meta-data' } }),
    )
    const fetcher = createFetcher()

    // act + assert
    await expect(fetcher.download(source)).rejects.toThrow(/private|local host/)
  })
})
