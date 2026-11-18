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
