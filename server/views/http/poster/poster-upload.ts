import { type PosterFileStore, type PosterRecordStore, replacePoster } from '@server/app'
import { type ImageExtension, imageExtensionFromBytes } from '@server/domain'
import { hasEndMarker } from '@server/infra/repositories/poster-fetcher'
import type { AppEnv } from '@server/views/auth'
import type { Context } from 'hono'
import * as v from 'valibot'
import { invalid, notFound } from '../error'
import type { PosterUploadForm } from './poster-upload.contract'

export interface PosterUploadOptions<Row, Fields> {
  records: PosterRecordStore<Row, Fields>
  files: PosterFileStore
  parseFields: (raw: string) => Fields | null
  /** Private rows are invisible to everyone but their creator; answer 404 when this fails. */
  authorize?: (id: string, userId: string) => Promise<boolean>
  /** Field-level validation that the contract cannot express, e.g. a recommender id. */
  validateFields?: (id: string, fields: Fields) => Promise<boolean>
}

/** A `data` part that fails to parse or validate answers 422, like any other contract breach. */
export function parseJsonPart<S extends v.GenericSchema>(schema: S) {
  return (raw: string): v.InferOutput<S> | null => {
    try {
      const result = v.safeParse(schema, JSON.parse(raw))

      return result.success ? result.output : null
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
  return async (c: Context<AppEnv>, form: PosterUploadForm) => {
    const id = c.req.param('id') ?? ''
    const user = c.get('user')
    const fields = options.parseFields(form.data)

    if (!fields) {
      return invalid(c, 'Invalid poster payload')
    }

    if (options.authorize && !(await options.authorize(id, user.id))) {
      return notFound(c)
    }

    if (options.validateFields && !(await options.validateFields(id, fields))) {
      return invalid(c, 'Invalid field')
    }

    const bytes = new Uint8Array(await form.file.arrayBuffer())
    const extension = sniffImage(bytes)

    if (!extension) {
      return invalid(c, 'Unsupported image type')
    }

    const saved = await replacePoster(options.records, options.files, { id, fields, extension, bytes }, user.id)

    if (!saved) {
      return notFound(c)
    }

    return c.json(saved, 200)
  }
}
