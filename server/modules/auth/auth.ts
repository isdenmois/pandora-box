import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { db, table } from '../../db'
import { Cookie } from 'elysia'
import { Session } from '../../db/schema'

const DAY_IN_MS = 1000 * 60 * 60 * 24

type Cookies = Record<string, Cookie<unknown>>

export const sessionCookieName = 'auth-session'

export function generateSessionToken() {
  return randomUUID()
}

export async function createSession(userId: string) {
  const sessionId = randomUUID()
  const session: table.Session = {
    id: sessionId,
    userId,
    expiresAt: new Date(Date.now() + DAY_IN_MS * 30),
  }
  await db.insert(table.session).values(session)
  return session
}

export async function validateSessionToken(sessionId: string) {
  const [result] = await db
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

  if (!result) {
    return { session: null, user: null }
  }
  const { session, user } = result

  const sessionExpired = Date.now() >= session.expiresAt.getTime()
  if (sessionExpired) {
    await db.delete(table.session).where(eq(table.session.id, session.id))
    return { session: null, user: null }
  }

  return { session, user }
}

export type SessionValidationResult = Awaited<ReturnType<typeof validateSessionToken>>

export async function getSession(cookies: Cookies) {
  const sessionId = getSessionIdCookie(cookies)

  if (sessionId) {
    const { session, user } = await validateSessionToken(sessionId)

    if (session && user) {
      updateSessionTokenCookie(cookies, session)

      return { session, user }
    }
  }

  return { session: null, user: null }
}

export async function invalidateSession(sessionId: string) {
  await db.delete(table.session).where(eq(table.session.id, sessionId))
}

export function getSessionIdCookie(cookies: Cookies): string | null {
  const cookie = cookies[sessionCookieName].value

  if (typeof cookie === 'string' && cookie.length) {
    return cookie
  }

  return null
}

async function updateSessionTokenCookie(cookies: Cookies, session: Session) {
  const renewSession = Date.now() >= session.expiresAt.getTime() - DAY_IN_MS * 15

  if (renewSession) {
    session.expiresAt = new Date(Date.now() + DAY_IN_MS * 30)
    setSessionTokenCookie(cookies, session)

    await db.update(table.session).set({ expiresAt: session.expiresAt }).where(eq(table.session.id, session.id))
  }
}

export function setSessionTokenCookie(cookies: Cookies, session: Session) {
  cookies[sessionCookieName].value = session.id
  cookies[sessionCookieName].path = '/'
  cookies[sessionCookieName].expires = session.expiresAt
  cookies[sessionCookieName].httpOnly = true
}

export function deleteSessionTokenCookie(cookies: Cookies) {
  cookies[sessionCookieName].remove()
  delete cookies[sessionCookieName]
}
