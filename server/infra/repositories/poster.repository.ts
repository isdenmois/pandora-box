import { createHash, randomUUID } from 'node:crypto'
import { mkdir, readdir, readFile, rename, stat, unlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { CONTENT_TYPE_BY_EXTENSION, contentTypeForExtension } from '@server/domain'
import { createPosterFetcher, type DownloadedPoster } from './poster-fetcher'

export interface PosterFile {
  bytes: Uint8Array
  contentType: string
  /** Strong validator derived from the bytes, so an unchanged file answers `304`. */
  etag: string
}

/**
 * Files are overwritten in place when a source changes, so the mtime alone is a weak validator;
 * hashing the body makes the tag change exactly when the bytes do.
 */
export function etagFor(bytes: Uint8Array): string {
  return `"${createHash('sha1').update(bytes).digest('base64url')}"`
}

export { CONTENT_TYPE_BY_EXTENSION }

/** Suffix of the half-written file; a crash between write and rename leaves one behind. */
const TEMP_SUFFIX = '.tmp'

/** Long enough that no save in flight can be mistaken for a crash leftover. */
const TEMP_TTL_MS = 10 * 60 * 1000

/** Extensions we write; a set, so a file name suffix can never match an object prototype key. */
const IMAGE_EXTENSIONS = new Set(Object.keys(CONTENT_TYPE_BY_EXTENSION))

export interface PosterRepositoryOptions {
  dir: string
  /** `false` disables downloads entirely (`IMAGE_FETCH=off`). */
  enabled: boolean
  maxBytes: number
}

export function createPosterRepository(options: PosterRepositoryOptions) {
  const fetcher = createPosterFetcher({ maxBytes: options.maxBytes, enabled: options.enabled })

  const pathFor = (fileName: string) => join(options.dir, fileName)

  const listFiles = async (): Promise<string[]> => {
    const entries = await readdir(options.dir, { withFileTypes: true }).catch(() => [])

    return entries.filter((entry) => entry.isFile()).map((entry) => entry.name)
  }

  /** Every `<id>.<ext>` sibling except `keep`; a rename leaves the old extension behind. */
  const otherFiles = async (id: string, keep: string | null): Promise<string[]> => {
    const files = await listFiles()

    return files.filter((fileName) => {
      const dot = fileName.lastIndexOf('.')

      return fileName !== keep && dot > 0 && fileName.slice(0, dot) === id
    })
  }

  const unlinkAll = (fileNames: string[]) =>
    Promise.all(fileNames.map((fileName) => unlink(pathFor(fileName)).catch(() => undefined)))

  const isStaleTemporary = async (fileName: string): Promise<boolean> => {
    const stats = await stat(pathFor(fileName)).catch(() => null)

    return !!stats && Date.now() - stats.mtimeMs >= TEMP_TTL_MS
  }

  /**
   * `jpeg` is never written (it is normalized to `jpg`), so a file carrying it can only be a
   * leftover; the worst case of deleting a live one is a single re-download.
   */
  const isAlwaysStale = (extension: string) => extension === 'jpeg'

  const listOrphans = async (knownIds: Set<string>): Promise<string[]> => {
    const files = await listFiles()
    const orphans: string[] = []

    for (const fileName of files) {
      // A save in flight owns its temp file; only crash leftovers are old enough to sweep.
      if (fileName.endsWith(TEMP_SUFFIX)) {
        if (await isStaleTemporary(fileName)) {
          orphans.push(fileName)
        }

        continue
      }

      const dot = fileName.lastIndexOf('.')

      if (dot <= 0) {
        continue
      }

      const extension = fileName.slice(dot + 1).toLowerCase()

      if (isAlwaysStale(extension)) {
        orphans.push(fileName)

        continue
      }

      const isImage = IMAGE_EXTENSIONS.has(extension)

      if (isImage && !knownIds.has(fileName.slice(0, dot))) {
        orphans.push(fileName)
      }
    }

    return orphans
  }

  return {
    fetcher,

    /** Reads a stored file; `null` is the miss signal. */
    async read(fileName: string): Promise<PosterFile | null> {
      const file = pathFor(fileName)

      try {
        await stat(file)
      } catch {
        return null
      }

      const extension = fileName.slice(fileName.lastIndexOf('.') + 1)
      const bytes = new Uint8Array(await readFile(file))

      return {
        bytes,
        contentType: contentTypeForExtension(extension),
        etag: etagFor(bytes),
      }
    },

    /** Writes `<id>.<extension>` atomically and drops the other extensions of the same record. */
    async save(id: string, extension: string, bytes: Uint8Array): Promise<string> {
      await mkdir(options.dir, { recursive: true })

      const fileName = `${id}.${extension}`
      const target = pathFor(fileName)
      // Two requests for one cold miss both save: a shared temp name makes the loser's rename
      // throw, which the controller would report as a failed download.
      const temporary = `${target}.${randomUUID()}${TEMP_SUFFIX}`

      // Write then rename: a reader can never observe a partially written poster.
      await writeFile(temporary, bytes)
      await rename(temporary, target)
      await unlinkAll(await otherFiles(id, fileName))

      return fileName
    },

    /** Called on record delete, on a source change, and on an explicit re-download. */
    async remove(id: string): Promise<void> {
      await unlinkAll(await otherFiles(id, null))
    },

    listOrphans,

    async removeOrphans(knownIds: Set<string>): Promise<number> {
      const orphans = await listOrphans(knownIds)

      await unlinkAll(orphans)

      return orphans.length
    },

    async download(source: string): Promise<DownloadedPoster> {
      return await fetcher.download(source)
    },
  }
}

export type PosterRepository = ReturnType<typeof createPosterRepository>
