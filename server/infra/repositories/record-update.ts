import { claimedCreator, type OwnedRecord } from '@/domain'
import { posterUpdateFor, type StoredPoster } from './poster-fields'

/** Fields every record patch may carry that change ownership or the poster. */
export interface RecordUpdateData {
  poster?: string | null
  private?: boolean
  recommendedBy?: string | null
}

export type StoredRecord = StoredPoster & OwnedRecord & { recommendedBy: string | null }

export interface RecordUpdateResult {
  /** The columns to write; empty when the patch only replayed a local poster path. */
  values: Record<string, unknown>
  /** The stored file no longer matches the row and must be unlinked. */
  removeFile: boolean
}

/**
 * Movies and series share these rules: a global row becomes the editor's when they make it private,
 * a creator cannot recommend their own row, and an uploaded file owns the only poster copy.
 * `stored` is null when the caller had no reason to read the row first.
 */
export function recordUpdateFor<T extends RecordUpdateData>(
  id: string,
  data: T,
  stored: StoredRecord | null,
  filePoster?: string,
  editorId?: string,
): RecordUpdateResult {
  const { poster: posterInput, ...rest } = data
  // The remaining columns are opaque to this function; the contract validated them on the way in.
  const values = { ...rest } as Record<string, unknown>

  const claimedBy = stored ? claimedCreator(stored, data.private, editorId) : null

  if (claimedBy) {
    values.createdBy = claimedBy

    // A creator cannot recommend their own row; drop the credit if the claim created that state.
    if ((values.recommendedBy ?? stored?.recommendedBy) === claimedBy) {
      values.recommendedBy = null
    }
  }

  if (filePoster) {
    // An uploaded file owns the only copy, so there is no source to download it from again.
    values.poster = filePoster
    values.posterSource = null
    return { values, removeFile: false }
  }

  if (posterInput !== undefined && stored) {
    const { fields, removeFile } = posterUpdateFor(id, posterInput, stored)

    if (fields) {
      Object.assign(values, fields)
    }

    return { values, removeFile }
  }

  return { values, removeFile: false }
}
