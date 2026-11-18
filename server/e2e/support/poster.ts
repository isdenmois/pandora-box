/** A real 1×1 PNG: signature and IEND chunk included, so the server-side checks accept it. */
export const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

/** Multipart body for the poster routes: a JSON `data` part and an image `file` part. */
export function uploadPosterForm(fields: Record<string, unknown>, fileName = 'poster.jpg') {
  const form = new FormData()

  form.append('data', JSON.stringify(fields))
  // The name lies about the type on purpose: the extension must come from the bytes.
  form.append('file', new File([PNG], fileName, { type: 'image/jpeg' }))

  return form
}
