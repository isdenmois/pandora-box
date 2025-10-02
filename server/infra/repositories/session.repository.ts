import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { SESSION_EXPIRE_IN, Session, table } from '@/domain'
import { db } from '../db'

export const sessionRepository = {
  async create(userId: string) {
    const sessionId = randomUUID()
    const session: Session = {
      id: sessionId,
      userId,
      expiresAt: new Date(Date.now() + SESSION_EXPIRE_IN),
    }

    await db.insert(table.session).values(session)

    return session
  },

  async getById(sessionId: string) {
    const result = await db
      .select({
        // Adjust user table here to tweak returned data
        user: {
          id: table.user.id,
          role: table.user.role,
          username: table.user.username,
        },
        session: table.session,
      })
      .from(table.session)
      .innerJoin(table.user, eq(table.session.userId, table.user.id))
      .where(eq(table.session.id, sessionId))

    return result[0]
  },

  async delete(sessionId: string) {
    await db.delete(table.session).where(eq(table.session.id, sessionId))
  },
}
