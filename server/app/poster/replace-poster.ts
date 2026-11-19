import { IMAGE_URL_PREFIX, type ImageExtension } from '@server/domain'

export interface PosterRecordStore<Row, Fields> {
  byId(id: string): Promise<Row | null>
  /** `filePoster` is the path of a file that is already on disk; it wins over `data.poster`. */
  update(id: string, data: Fields, filePoster?: string, editorId?: string): Promise<Row | null>
}

export interface PosterFileStore {
  save(id: string, extension: string, bytes: Uint8Array): Promise<string>
  remove(id: string): Promise<void>
}

export interface ReplacePosterInput<Fields> {
  id: string
  fields: Fields
  extension: ImageExtension
  bytes: Uint8Array
}

/**
 * An uploaded file owns its only copy, so the row gets the local path and no source. The record is
 * checked first: writing bytes for an id nobody holds would only leave an orphan behind.
 */
export async function replacePoster<Row, Fields>(
  records: PosterRecordStore<Row, Fields>,
  files: PosterFileStore,
  input: ReplacePosterInput<Fields>,
  editorId?: string,
): Promise<Row | null> {
  if (!(await records.byId(input.id))) {
    return null
  }

  const fileName = await files.save(input.id, input.extension, input.bytes)

  try {
    const saved = await records.update(input.id, input.fields, `${IMAGE_URL_PREFIX}/${fileName}`, editorId)

    // The record can be deleted between the check and the update; the file is then an orphan.
    if (!saved) {
      await files.remove(input.id)
    }

    return saved
  } catch (error) {
    await files.remove(input.id)
    throw error
  }
}
