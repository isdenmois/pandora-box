import { sessionUC } from '@server/app'
import { SESSION_ROTATE_IN, type Session } from '@server/domain'
import { sessionRepository } from '@server/infra'
import type { Context } from 'hono'
import { authCookie } from './auth-cookie'

export interface AuthUser {
  id: string
  role: string | null
  username: string
}

/** What the auth middleware puts on the context for every guarded handler. */
export interface AppEnv {
  Variables: {
    user: AuthUser
  }
}

export interface GetSessionOptions {
  /**
   * Rotation writes a new cookie and retires the old session id. Only a response that carries
   * the cookie can do that, so image requests pass `false`: several of them run at once and all
   * but the winner would otherwise be left with a retired id.
   */
  rotate?: boolean
}

export async function getSession(c: Context, options: GetSessionOptions = {}) {
  const sessionId = authCookie.getSessionId(c)

  if (sessionId) {
    const { session, user } = await sessionUC.validate(sessionId)

    if (session && user) {
      if (options.rotate ?? true) {
        await rotateSession(c, session)
      }

      return { session, user }
    }
  }

  return { session: null, user: null }
}

async function rotateSession(c: Context, session: Session) {
  const renewSession = Date.now() >= session.expiresAt.getTime() - SESSION_ROTATE_IN

  if (renewSession) {
    const newSession = await sessionRepository.create(session.userId)

    authCookie.setSession(c, newSession)

    await sessionRepository.delete(session.id)

    Object.assign(session, newSession)
  }
}
