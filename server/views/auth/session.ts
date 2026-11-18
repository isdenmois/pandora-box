import { sessionUC } from '@/app'
import { SESSION_ROTATE_IN, type Session } from '@/domain'
import { sessionRepository } from '@/infra'
import { authCookie, type Cookies } from './auth-cookie'

export interface GetSessionOptions {
  /**
   * Rotation writes a new cookie and retires the old session id. Only a response that carries
   * the cookie can do that, so image requests pass `false`: several of them run at once and all
   * but the winner would otherwise be left with a retired id.
   */
  rotate?: boolean
}

export async function getSession(cookies: Cookies, options: GetSessionOptions = {}) {
  const sessionId = authCookie.getSessionId(cookies)

  if (sessionId) {
    const { session, user } = await sessionUC.validate(sessionId)

    if (session && user) {
      if (options.rotate ?? true) {
        await rotateSession(cookies, session)
      }

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
