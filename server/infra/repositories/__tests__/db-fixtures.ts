import { randomUUID } from 'node:crypto'
import { table } from '@/domain'
import { db } from '@/infra'

/** A fresh set of rows for every test; the server test env points `DATABASE_URL` at `:memory:`. */
export async function resetDatabase() {
  await db.delete(table.movieView)
  await db.delete(table.seriesView)
  await db.delete(table.movie)
  await db.delete(table.series)
  await db.delete(table.session)
  await db.delete(table.user)
}

export async function insertUser(id: string, overrides: Partial<typeof table.user.$inferInsert> = {}) {
  await db.insert(table.user).values({ id, username: id, passwordHash: 'hash', role: 'user', ...overrides })

  return id
}

export async function insertMovie(overrides: Partial<typeof table.movie.$inferInsert> = {}) {
  const row = {
    id: randomUUID(),
    title: 'A Movie',
    createdBy: 'creator',
    private: false,
    ...overrides,
  }

  await db.insert(table.movie).values(row)

  return row.id
}

export async function insertSeries(overrides: Partial<typeof table.series.$inferInsert> = {}) {
  const row = {
    id: randomUUID(),
    title: 'A Series',
    createdBy: 'creator',
    private: false,
    season: 1,
    ...overrides,
  }

  await db.insert(table.series).values(row)

  return row.id
}
