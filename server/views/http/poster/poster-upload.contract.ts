import { t } from 'elysia'

/**
 * The file part only carries the size cap: the image allowlist is enforced from the bytes (a
 * declared MIME type is a claim, not a fact), so the accepted types cannot drift from what
 * `extensionFromContentType` can map.
 */
export const posterUploadBody = (maxBytes: number) =>
  t.Object({
    /**
     * JSON body for the record fields, so the update contract stays the single shape.
     * Elysia parses multipart values that start with `{` before validation, so the part can
     * arrive either as raw JSON or as the already-parsed object.
     */
    data: t.Union([t.String({ minLength: 1 }), t.Record(t.String(), t.Unknown())]),
    file: t.File({ maxSize: maxBytes }),
  })
