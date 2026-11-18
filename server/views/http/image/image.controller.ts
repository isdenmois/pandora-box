import { Elysia } from 'elysia'
import { contentTypeForExtension, IMAGE_URL_PREFIX, parsePosterFileName } from '@/domain'
import { movieRepository, posterRepository, seriesRepository } from '@/infra'
import { type Cookies, getSession } from '@/views/auth'
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
  hasSession: (cookies: unknown) => Promise<boolean>
}

const NO_STORE = 'no-store'
const REVALIDATE = 'public, no-cache'

const redirect = (location: string) =>
  new Response(null, { status: 302, headers: { location, 'cache-control': NO_STORE } })

const notFound = () => new Response(null, { status: 404, headers: { 'cache-control': NO_STORE } })

export function createImageController(deps: ImageControllerDeps) {
  return new Elysia({ name: 'image controller' }).get(
    `${IMAGE_URL_PREFIX}/:fileName`,
    async ({ params, cookie, headers }) => {
      const parsed = parsePosterFileName(params.fileName)

      if (!parsed) {
        return notFound()
      }

      const stored = await deps.read(params.fileName)

      // nginx serves hits; this handler only runs on a miss (nginx proxy, vite, e2e).
      if (stored) {
        // `no-cache` still revalidates, so the validator keeps unchanged posters off the wire.
        if (headers['if-none-match'] === stored.etag) {
          return new Response(null, {
            status: 304,
            headers: { etag: stored.etag, 'cache-control': REVALIDATE },
          })
        }

        return new Response(stored.bytes, {
          status: 200,
          headers: { 'content-type': stored.contentType, 'cache-control': REVALIDATE, etag: stored.etag },
        })
      }

      const record = await deps.findRecord(parsed.id)

      if (!record) {
        return notFound()
      }

      const expected = `${IMAGE_URL_PREFIX}/${params.fileName}`

      // The row points at another extension: correct the client instead of writing a second file.
      if (record.poster && record.poster !== expected) {
        return redirect(record.poster)
      }

      const source = record.posterSource

      if (!source) {
        return notFound()
      }

      // No session means no server-side fetch; the card still renders from the CDN.
      if (!(await deps.hasSession(cookie)) || deps.isFailing(source)) {
        return redirect(source)
      }

      try {
        const downloaded = await deps.download(source)
        const fileName = await deps.save(parsed.id, downloaded.extension, downloaded.bytes)
        const storedPath = `${IMAGE_URL_PREFIX}/${fileName}`

        if (storedPath !== record.poster) {
          await deps.setPosterPath(parsed.id, storedPath)
        }

        return new Response(downloaded.bytes, {
          status: 200,
          headers: { 'content-type': contentTypeForExtension(downloaded.extension), 'cache-control': REVALIDATE },
        })
      } catch {
        return redirect(source)
      }
    },
  )
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
  async hasSession(cookies) {
    // Validation must not rotate: a poster request has no use for the new cookie, and rotating
    // here would retire the id that the other images firing at the same time still hold.
    const { user } = await getSession(cookies as Cookies, { rotate: false })

    return !!user
  },
})
