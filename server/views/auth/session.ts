import { sessionUC } from '@/app'
import { SESSION_ROTATE_IN, type Session } from '@/domain'
import { sessionRepository } from '@/infra'
import { authCookie, type Cookies } from './auth-cookie'

export async function getSession(cookies: Cookies) {
  const sessionId = authCookie.getSessionId(cookies)

  if (sessionId) {
    const { session, user } = await sessionUC.validate(sessionId)

    if (session && user) {
      await rotateSession(cookies, session)

      return { session, user }
    }
  }

  return { session: null, user: null }
}

async function rotateSession(cookies: Cookies, session: Session) {
  const renewSession = Date.now() >= session.expiresAt.getTime() - SESSION_ROTATE_IN

  if (renewSession) {
    const newSession = await sessionRepository.create(session.userId)

    authCookie.setSession(cookies, newSession)

    await sessionRepository.delete(session.id)

    Object.assign(session, newSession)
  }
}
