import { CONTENT_TYPE_BY_EXTENSION } from '@/server'

/** Every format the server can store; deriving `accept` keeps the picker and the writer in sync. */
const POSTER_TYPES = new Set(Object.values(CONTENT_TYPE_BY_EXTENSION))

export const POSTER_ACCEPT = [...POSTER_TYPES].join(',')

/**
 * Mirrors the server's `IMAGE_MAX_BYTES` default. Server env is not shipped to the browser, so this
 * is only a pre-check: the multipart contract rejects anything larger regardless.
 */
export const POSTER_MAX_BYTES = 5 * 1024 * 1024

const MAX_MB = Math.floor(POSTER_MAX_BYTES / 1024 / 1024)

export function posterFileError(file: File): string | null {
  // An unlabelled file is left to the server, which sniffs the bytes anyway.
  if (file.type && !POSTER_TYPES.has(file.type)) {
    return 'Choose a JPEG, PNG, WebP, GIF or AVIF image'
  }

  if (file.size > POSTER_MAX_BYTES) {
    return `The image must be ${MAX_MB} MB or smaller`
  }

  return null
}
