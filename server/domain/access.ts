export interface OwnedRecord {
  createdBy: string
  private: boolean
}

/**
 * Global rows are shared with every authenticated user; a private row belongs to its creator
 * alone. There is no admin override: the backup/restore and import tools are the documented
 * exceptions.
 */
export function canAccess(record: OwnedRecord, userId: string): boolean {
  return !record.private || record.createdBy === userId
}

/**
 * Claiming a shared row by making it private transfers it to the editor. A row that is already
 * private stays with its creator, and an unchanged visibility never transfers anything.
 */
export function claimedCreator(
  record: OwnedRecord,
  nextPrivate: boolean | undefined,
  editorId: string | undefined,
): string | null {
  if (!editorId || nextPrivate !== true || record.private || record.createdBy === editorId) {
    return null
  }

  return editorId
}
