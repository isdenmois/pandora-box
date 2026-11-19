import { contentTypeForExtension, IMAGE_URL_PREFIX, parsePosterFileName } from '@server/domain'
import { movieRepository, posterRepository, seriesRepository } from '@server/infra'
import { getSession } from '@server/views/auth'
import type { Context } from 'hono'
import { Hono } from 'hono'
import { findPosterRow } from '../poster/poster-record'

export interface PosterRecord {
  poster: string | null
  posterSource: string | null
}

export interface StoredFile {
  bytes: Uint8Array
  contentType: string
  etag: string
}

export interface ImageControllerDeps {
  read: (fileName: string) => Promise<StoredFile | null>
  download: (source: string) => Promise<{ bytes: Uint8Array; extension: string }>
  save: (id: string, extension: string, bytes: Uint8Array) => Promise<string>
  isFailing: (source: string) => boolean
  findRecord: (id: string) => Promise<PosterRecord | null>
  setPosterPath: (id: string, path: string) => Promise<void>
  hasSession: (c: Context) => Promise<boolean>
}

const NO_STORE = 'no-store'
const REVALIDATE = 'public, no-cache'

const redirect = (c: Context, location: string) => {
  c.header('cache-control', NO_STORE)

  return c.redirect(location, 302)
}

const notFound = (c: Context) => c.body(null, 404, { 'cache-control': NO_STORE })

/** Bun types `Uint8Array` over `ArrayBufferLike`; `Response` wants ArrayBuffer-backed bytes. */
function imageBody(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength)

  copy.set(bytes)

  return copy.buffer
}

export function createImageController(deps: ImageControllerDeps) {
  return new Hono().get(`${IMAGE_URL_PREFIX}/:fileName`, async (c) => {
    const fileName = c.req.param('fileName')
    const parsed = parsePosterFileName(fileName)

    if (!parsed) {
      return notFound(c)
    }

    const stored = await deps.read(fileName)

    // nginx serves hits; this handler only runs on a miss (nginx proxy, vite, e2e).
    if (stored) {
      // `no-cache` still revalidates, so the validator keeps unchanged posters off the wire.
      if (c.req.header('if-none-match') === stored.etag) {
        return c.body(null, 304, { etag: stored.etag, 'cache-control': REVALIDATE })
      }

      return c.body(imageBody(stored.bytes), 200, {
        'content-type': stored.contentType,
        'cache-control': REVALIDATE,
        etag: stored.etag,
      })
    }

    const record = await deps.findRecord(parsed.id)

    if (!record) {
      return notFound(c)
    }

    const expected = `${IMAGE_URL_PREFIX}/${fileName}`

    // The row points at another extension: correct the client instead of writing a second file.
    if (record.poster && record.poster !== expected) {
      return redirect(c, record.poster)
    }

    const source = record.posterSource

    if (!source) {
      return notFound(c)
    }

    // No session means no server-side fetch; the card still renders from the CDN.
    if (!(await deps.hasSession(c)) || deps.isFailing(source)) {
      return redirect(c, source)
    }

    try {
      const downloaded = await deps.download(source)
      const savedName = await deps.save(parsed.id, downloaded.extension, downloaded.bytes)
      const storedPath = `${IMAGE_URL_PREFIX}/${savedName}`

      if (storedPath !== record.poster) {
        await deps.setPosterPath(parsed.id, storedPath)
      }

      return c.body(imageBody(downloaded.bytes), 200, {
        'content-type': contentTypeForExtension(downloaded.extension),
        'cache-control': REVALIDATE,
      })
    } catch {
      return redirect(c, source)
    }
  })
}

export const imageController = createImageController({
  read: (fileName) => posterRepository.read(fileName),
  download: (source) => posterRepository.download(source),
  save: (id, extension, bytes) => posterRepository.save(id, extension, bytes),
  isFailing: (source) => posterRepository.fetcher.isFailing(source),
  findRecord: findPosterRow,
  async setPosterPath(id, path) {
    // Only one of the two tables holds this id.
    await movieRepository.setPosterPath(id, path)
    await seriesRepository.setPosterPath(id, path)
  },
  async hasSession(c) {
    // Validation must not rotate: a poster request has no use for the new cookie, and rotating
    // here would retire the id that the other images firing at the same time still hold.
    const { user } = await getSession(c, { rotate: false })

    return !!user
  },
})
