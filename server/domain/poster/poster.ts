export const IMAGE_URL_PREFIX = '/images'

export const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'] as const

export type ImageExtension = 'jpg' | 'png' | 'webp' | 'gif' | 'avif'

const KNOWN_EXTENSIONS = new Set<string>(['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'])

const EXTENSION_BY_CONTENT_TYPE: Record<string, ImageExtension> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
}

/** `jpeg` is the same format as `jpg`; anything else is not an image we store. */
export function normalizeExtension(extension: string): ImageExtension | null {
  const normalized = extension.toLowerCase().replace(/^\./, '')

  if (normalized === 'jpeg' || normalized === 'jpg') {
    return 'jpg'
  }

  return KNOWN_EXTENSIONS.has(normalized) ? (normalized as ImageExtension) : null
}

export function extensionFromContentType(contentType: string | null | undefined): ImageExtension | null {
  if (!contentType) {
    return null
  }

  const mime = contentType.split(';')[0]?.trim().toLowerCase()

  return mime ? (EXTENSION_BY_CONTENT_TYPE[mime] ?? null) : null
}

/** Valid MIME types only: `image/jpg` is not registered, it must be `image/jpeg`. */
export const CONTENT_TYPE_BY_EXTENSION: Record<ImageExtension, string> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  avif: 'image/avif',
}

export function contentTypeForExtension(extension: string): string {
  return CONTENT_TYPE_BY_EXTENSION[extension as ImageExtension] ?? 'application/octet-stream'
}

/** Magic bytes decide what a file really is; a declared MIME type is only a claim. */
const SIGNATURES: { extension: ImageExtension; offset: number; bytes: readonly number[] }[] = [
  { extension: 'jpg', offset: 0, bytes: [0xff, 0xd8, 0xff] },
  { extension: 'png', offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { extension: 'gif', offset: 0, bytes: [0x47, 0x49, 0x46, 0x38] },
  // `WEBP` sits after the four-byte `RIFF` chunk size.
  { extension: 'webp', offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] },
  // The major brand inside the ISO-BMFF `ftyp` box: still or animated AVIF.
  { extension: 'avif', offset: 8, bytes: [0x61, 0x76, 0x69, 0x66] },
  { extension: 'avif', offset: 8, bytes: [0x61, 0x76, 0x69, 0x73] },
]

/** Identifies an upload from its bytes; `null` means the file is not one we can store. */
export function imageExtensionFromBytes(bytes: Uint8Array): ImageExtension | null {
  for (const { extension, offset, bytes: signature } of SIGNATURES) {
    if (bytes.length < offset + signature.length) {
      continue
    }

    if (signature.every((byte, index) => bytes[offset + index] === byte)) {
      return extension
    }
  }

  return null
}

/** Best guess for a file name decided before the bytes exist; defaults to jpg. */
export function extensionFromUrl(source: string): ImageExtension {
  try {
    const pathname = new URL(source).pathname
    const lastDot = pathname.lastIndexOf('.')

    if (lastDot === -1) {
      return 'jpg'
    }

    return normalizeExtension(pathname.slice(lastDot + 1)) ?? 'jpg'
  } catch {
    return 'jpg'
  }
}

export function isImageSource(value: string | null | undefined): value is string {
  if (!value) {
    return false
  }

  try {
    const url = new URL(value)

    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function isLocalPoster(value: string | null | undefined): value is string {
  return !!value && value.startsWith(`${IMAGE_URL_PREFIX}/`)
}

export function posterFileName(id: string, extension: ImageExtension): string {
  return `${id}.${extension}`
}

/** The value stored in `poster`: the same-origin path the UI renders. */
export function posterPath(id: string, source: string): string {
  return `${IMAGE_URL_PREFIX}/${posterFileName(id, extensionFromUrl(source))}`
}

export function parsePosterFileName(fileName: string): { id: string; extension: ImageExtension } | null {
  const lastDot = fileName.lastIndexOf('.')

  if (lastDot <= 0) {
    return null
  }

  const extension = normalizeExtension(fileName.slice(lastDot + 1))

  if (!extension) {
    return null
  }

  return { id: fileName.slice(0, lastDot), extension }
}
