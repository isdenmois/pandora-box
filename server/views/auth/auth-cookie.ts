import type { Session } from '@server/domain'
import type { Context } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'

export const sessionCookieName = 'auth-session'

export const authCookie = {
  getSessionId(c: Context): string | null {
    const value = getCookie(c, sessionCookieName)

    return typeof value === 'string' && value.length ? value : null
  },

  setSession(c: Context, session: Session) {
    setCookie(c, sessionCookieName, session.id, {
      path: '/',
      expires: session.expiresAt,
      httpOnly: true,
    })
  },

  deleteSession(c: Context) {
    deleteCookie(c, sessionCookieName, { path: '/' })
  },
}
