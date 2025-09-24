import { Cookie } from 'elysia'
import { Session } from '@/domain'

export type Cookies = Record<string, Cookie<unknown>>

export const sessionCookieName = 'auth-session'

export const authCookie = {
  getSessionId(cookies: Cookies): string | null {
    const cookie = cookies[sessionCookieName].value

    if (typeof cookie === 'string' && cookie.length) {
      return cookie
    }

    return null
  },

  setSession(cookies: Cookies, session: Session) {
    cookies[sessionCookieName].value = session.id
    cookies[sessionCookieName].path = '/'
    cookies[sessionCookieName].expires = session.expiresAt
    cookies[sessionCookieName].httpOnly = true
  },

  deleteSession(cookies: Cookies) {
    cookies[sessionCookieName].remove()
    delete cookies[sessionCookieName]
  },
}
