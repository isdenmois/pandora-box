import { toBackup } from '@server/domain'
import { sql } from 'drizzle-orm'
import { db } from '../db'
import { type BackupTable, normalizeRow } from './backup-fields'

type Backup = Record<BackupTable, unknown[]>

export const backupRepository = {
  async create() {
    const data = {} as Backup

    for (const key in toBackup) {
      const table = key as BackupTable

      data[table] = await db.select().from(toBackup[table])
    }

    return data
  },

  async restore(data: Backup) {
    const users = Array.isArray(data.user) ? (data.user as Record<string, unknown>[]) : []
    const fallbackCreatorId =
      (users.find((row) => row.role === 'admin')?.id as string | undefined) ??
      (users[0]?.id as string | undefined) ??
      null

    // The Bun SQLite driver runs transactions synchronously: statements inside the callback must
    // not be awaited, or they execute after the transaction has already committed.
    db.transaction((tx) => {
      for (const key in data) {
        const t = key as BackupTable

        if (t in toBackup) {
          const table = toBackup[t]
          const rows = data[t] as Record<string, unknown>[]

          tx.delete(table).run()

          // A normal backup contains empty tables (the view tables, usually); Drizzle rejects an
          // empty `values()` call, so only insert when there is something to insert.
          if (rows.length) {
            tx.insert(table)
              .values(rows.map((row) => normalizeRow(t, row, fallbackCreatorId)) as (typeof table.$inferInsert)[])
              .run()
          }
        }
      }
    })

    // SQLite refuses VACUUM inside a transaction, so it runs once the restore has committed.
    await db.run(sql`VACUUM;`)
  },
}
