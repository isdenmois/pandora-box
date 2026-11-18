import { t } from 'elysia'

/**
 * The file part only carries the size cap: the image allowlist is enforced from the bytes (a
 * declared MIME type is a claim, not a fact), so the accepted types cannot drift from what
 * `extensionFromContentType` can map.
 */
export const posterUploadBody = (maxBytes: number) =>
  t.Object({
    /** JSON body for the record fields, so the update contract stays the single shape. */
    data: t.String({ minLength: 1 }),
    file: t.File({ maxSize: maxBytes }),
  })
