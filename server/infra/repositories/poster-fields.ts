import { isLocalPoster, posterPath } from '@server/domain'

export interface PosterFields {
  poster: string | null
  posterSource: string | null
}

export interface StoredPoster {
  poster: string | null
  posterSource: string | null
}

/**
 * Create input carries the *source* URL in `poster`; the row stores the local path and keeps the
 * origin in `posterSource`.
 */
export function posterFieldsFor(id: string, poster: string | null | undefined): PosterFields {
  if (!poster) {
    return { poster: null, posterSource: null }
  }

  if (isLocalPoster(poster)) {
    return { poster, posterSource: null }
  }

  return { poster: posterPath(id, poster), posterSource: poster }
}

/**
 * Update input may replay a local path (the client only knows the URL it renders). Those carry no
 * information about the origin, so the stored source is kept: overwriting it would leave the row
 * pointing at a file nobody can explain how to rebuild.
 */
export function posterUpdateFor(
  id: string,
  posterInput: string | null,
  stored: StoredPoster,
): { fields: PosterFields | null; removeFile: boolean } {
  if (isLocalPoster(posterInput)) {
    return { fields: null, removeFile: false }
  }

  if (!posterInput) {
    return { fields: posterFieldsFor(id, null), removeFile: stored.posterSource !== null || stored.poster !== null }
  }

  // The path is only a guess made before the bytes exist; the downloader corrects it when the URL
  // and the content type disagree. Replaying the same origin (an OMDB refresh, say) must not
  // re-guess it: the row would point at a file that was never written while the real one sits on
  // disk, turning every later view into a cold miss.
  if (posterInput === stored.posterSource && isLocalPoster(stored.poster)) {
    return { fields: null, removeFile: false }
  }

  const fields = posterFieldsFor(id, posterInput)

  return { fields, removeFile: fields.posterSource !== stored.posterSource }
}

/**
 * Restore payloads may predate the column split: `poster` still holds the remote URL and there is
 * no source. Those localize like a create. A row that already carries a local path is left
 * untouched — `posterFieldsFor` would treat it as source-less and drop `posterSource`.
 */
export function posterRestoreFor(id: string, poster: string | null): PosterFields | null {
  if (!poster || isLocalPoster(poster)) {
    return null
  }

  return posterFieldsFor(id, poster)
}
