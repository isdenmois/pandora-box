import * as v from 'valibot'

/**
 * The file part only carries the size cap: the image allowlist is enforced from the bytes (a
 * declared MIME type is a claim, not a fact), so the accepted types cannot drift from what
 * `extensionFromContentType` can map.
 */
export const posterUploadBody = (maxBytes: number) =>
  v.object({
    /** The record fields, JSON-encoded; the update contract stays the single shape. */
    data: v.pipe(v.string(), v.minLength(1)),
    file: v.pipe(
      v.instance(File),
      v.check((file) => file.size <= maxBytes, `The image must be ${maxBytes} bytes or smaller`),
    ),
  })

export type PosterUploadForm = v.InferOutput<ReturnType<typeof posterUploadBody>>
