import type { Static, TSchema } from '@sinclair/typebox'
import { Value } from '@sinclair/typebox/value'
import { status } from 'elysia'
import { type PosterFileStore, type PosterRecordStore, replacePoster } from '@/app'
import { type ImageExtension, imageExtensionFromBytes } from '@/domain'
import { hasEndMarker } from '@/infra/repositories/poster-fetcher'

export interface PosterUploadOptions<Row, Fields> {
  records: PosterRecordStore<Row, Fields>
  files: PosterFileStore
  parseFields: (raw: string | Record<string, unknown>) => Fields | null
  /** Private rows are invisible to everyone but their creator; answer 404 when this fails. */
  authorize?: (id: string, userId: string) => Promise<boolean>
  /** Field-level validation that the TypeBox contract cannot express, e.g. a recommender id. */
  validateFields?: (id: string, fields: Fields) => Promise<boolean>
}

/** Only the parts of Elysia's context this handler reads; `user` comes from `authGuard`. */
interface UploadContext {
  params: { id: string }
  body: { data: string | Record<string, unknown>; file: File }
  user: { id: string }
}

/** A `data` part that fails to parse or validate answers 422, like any other contract breach. */
export function parseJsonPart<T extends TSchema>(schema: T) {
  // Elysia pre-parses multipart values that look like JSON; older clients still send a string.
  return (raw: string | Record<string, unknown>): Static<T> | null => {
    try {
      return Value.Parse(schema, typeof raw === 'string' ? JSON.parse(raw) : raw)
    } catch {
      return null
    }
  }
}

/** The extension comes from the bytes; a truncated image is rejected even if it sniffs as one. */
function sniffImage(bytes: Uint8Array): ImageExtension | null {
  const extension = imageExtensionFromBytes(bytes)

  if (!extension || !hasEndMarker(bytes, extension)) {
    return null
  }

  return extension
}

export function createPosterUploadHandler<Row, Fields>(options: PosterUploadOptions<Row, Fields>) {
  return async ({ params: { id }, body, user }: UploadContext) => {
    const fields = options.parseFields(body.data)

    if (!fields) {
      return status(422, { message: 'Invalid poster payload' })
    }

    if (options.authorize && !(await options.authorize(id, user.id))) {
      return status(404, { message: 'Not found' })
    }

    if (options.validateFields && !(await options.validateFields(id, fields))) {
      return status(422, { message: 'Invalid field' })
    }

    const bytes = new Uint8Array(await body.file.arrayBuffer())
    const extension = sniffImage(bytes)

    if (!extension) {
      return status(422, { message: 'Unsupported image type' })
    }

    const saved = await replacePoster(options.records, options.files, { id, fields, extension, bytes }, user.id)

    if (!saved) {
      return status(404, { message: 'Not found' })
    }

    return saved
  }
}
