import { toBackup } from '@/domain'
import { db } from '../db'
import { sql } from 'drizzle-orm'

type TableName = keyof typeof toBackup
type Backup = Record<TableName, unknown[]>

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

          await tx.delete(table)
          await tx.insert(table).values(data[t] as (typeof table.$inferInsert)[])
        }
      }

      await tx.run(sql`VACUUM;`)
    })
  },
}
