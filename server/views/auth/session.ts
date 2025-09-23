import { Session, sessionRepository } from '../../infra'
import { sessionUC } from '../../app'
import { authCookie, Cookies } from './auth-cookie'

const DAY_IN_MS = 1000 * 60 * 60 * 24

export async function getSession(cookies: Cookies) {
  const sessionId = authCookie.getSessionId(cookies)

  if (sessionId) {
    const { session, user } = await sessionUC.validate(sessionId)

    if (session && user) {
      rotateSession(cookies, session)

      return { session, user }
    }
  }

  return { session: null, user: null }
}

async function rotateSession(cookies: Cookies, session: Session) {
  const renewSession = Date.now() >= session.expiresAt.getTime() - DAY_IN_MS * 15

  if (renewSession) {
    const newSession = await sessionRepository.create(session.userId)

    authCookie.setSession(cookies, session)

    await sessionRepository.delete(session.id)

    Object.assign(session, newSession)
  }
}
