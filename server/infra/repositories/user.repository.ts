import { randomUUID } from 'node:crypto'
import { table, type User, type UserSummary } from '@server/domain'
import { eq } from 'drizzle-orm'
import { db } from '../db'

export const userRepository = {
  createUser(username: string, passwordHash: string) {
    const id = randomUUID()

    return db.insert(table.user).values({ id, username, passwordHash })
  },

  async getByUsername(username: string): Promise<User> {
    const results = await db.select().from(table.user).where(eq(table.user.username, username))

    return results[0]
  },

  /** Names only; used by the recommender picker and attribution labels. */
  async list(): Promise<UserSummary[]> {
    return await db
      .select({ id: table.user.id, username: table.user.username })
      .from(table.user)
      .orderBy(table.user.username)
  },

  async exists(id: string): Promise<boolean> {
    const rows = await db.select({ id: table.user.id }).from(table.user).where(eq(table.user.id, id)).limit(1)

    return rows.length > 0
  },
}
