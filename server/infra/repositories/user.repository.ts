import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { table, User } from '@/domain'
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
}
