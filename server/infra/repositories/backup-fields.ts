import type { toBackup } from '@server/domain'
import { posterRestoreFor } from './poster-fields'

export type BackupTable = keyof typeof toBackup

/**
 * Rows written before the column split still carry the remote URL in `poster` with no source, and
 * nothing else would ever localize them (the migration has already run on this database). The
 * poster tables go through the same mapping as a create; every other table is restored as-is.
 */
function withLocalPoster(table: BackupTable, row: Record<string, unknown>) {
  if (table !== 'movie' && table !== 'series') {
    return row
  }

  const fields = posterRestoreFor(String(row.id), typeof row.poster === 'string' ? row.poster : null)

  return fields ? { ...row, ...fields } : row
}

/**
 * Pre-migration backups carry `userId` and no `createdBy`. Map that to the creator, assigning the
 * ownerless rows to the first admin in the backup (falling back to its first user). New backups
 * already have `createdBy`, so this is a no-op for them.
 */
function withOwnership(table: BackupTable, row: Record<string, unknown>, fallbackCreatorId: string | null) {
  if (table !== 'movie' && table !== 'series') {
    return row
  }

  const { userId: legacyUserId, ...rest } = row
  const createdBy =
    (typeof rest.createdBy === 'string' && rest.createdBy) ||
    (typeof legacyUserId === 'string' && legacyUserId) ||
    fallbackCreatorId

  if (!createdBy) {
    throw new Error('Backup contains rows without an owner and no user to assign them to')
  }

  return {
    ...rest,
    createdBy,
    recommendedBy: typeof rest.recommendedBy === 'string' ? rest.recommendedBy : null,
    private: rest.private ?? false,
  }
}

export function normalizeRow(table: BackupTable, row: Record<string, unknown>, fallbackCreatorId: string | null) {
  return withLocalPoster(table, withOwnership(table, row, fallbackCreatorId))
}
