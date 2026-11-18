import { sql } from 'drizzle-orm'
import { toBackup } from '@/domain'
import { db } from '../db'
import { posterRestoreFor } from './poster-fields'

type TableName = keyof typeof toBackup
type Backup = Record<TableName, unknown[]>

/**
 * Rows written before the column split still carry the remote URL in `poster` with no source, and
 * nothing else would ever localize them (the migration has already run on this database). The
 * poster tables go through the same mapping as a create; every other table is restored as-is.
 */
function withLocalPoster(table: TableName, row: Record<string, unknown>) {
  if (table !== 'movie' && table !== 'series') {
    return row
  }

  const fields = posterRestoreFor(String(row.id), typeof row.poster === 'string' ? row.poster : null)

  return fields ? { ...row, ...fields } : row
}

export const backupRepository = {
  async create() {
    const data = {} as Backup

    for (const key in toBackup) {
      const table = key as TableName

      data[table] = await db.select().from(toBackup[table])
    }

    return data
  },

  async restore(data: Backup) {
    await db.transaction(async (tx) => {
      for (const key in data) {
        const t = key as TableName

        if (t in toBackup) {
          const table = toBackup[t]
          const rows = data[t] as Record<string, unknown>[]

          await tx.delete(table)
          await tx.insert(table).values(rows.map((row) => withLocalPoster(t, row)) as (typeof table.$inferInsert)[])
        }
      }

      await tx.run(sql`VACUUM;`)
    })
  },
}
