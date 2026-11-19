import type { Session } from '@server/domain'
import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'
import { authCookie, sessionCookieName } from '../auth-cookie'

const session: Session = {
  id: 'session-1',
  userId: 'user-1',
  // Hono refuses an `Expires` more than 400 days ahead, matching the RFC.
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
}

const readApp = new Hono().get('/', (c) => c.text(authCookie.getSessionId(c) ?? 'null'))
const writeApp = new Hono()
  .get('/set', (c) => {
    authCookie.setSession(c, session)

    return c.body(null, 204)
  })
  .get('/delete', (c) => {
    authCookie.deleteSession(c)

    return c.body(null, 204)
  })

const call = (app: Hono, path = '/', cookie?: string) =>
  app.request(`http://localhost${path}`, { headers: cookie ? { cookie } : undefined })

describe('authCookie.getSessionId', () => {
  it('returns the id stored in the cookie', async () => {
    // act
    const response = await call(readApp, '/', `${sessionCookieName}=session-1`)

    // assert
    expect(await response.text()).toBe('session-1')
  })

  it('returns null when the cookie is absent or empty', async () => {
    // act
    const absent = await call(readApp)
    const empty = await call(readApp, '/', `${sessionCookieName}=`)

    // assert
    expect(await absent.text()).toBe('null')
    expect(await empty.text()).toBe('null')
  })
})

describe('authCookie.setSession', () => {
  it('stores the session id with the hardening flags', async () => {
    // act
    const response = await call(writeApp, '/set')

    // assert
    const setCookie = response.headers.getSetCookie().find((value) => value.startsWith(sessionCookieName))

    expect(setCookie).toContain(`${sessionCookieName}=session-1`)
    expect(setCookie).toContain('Path=/')
    expect(setCookie).toContain('HttpOnly')
    expect(setCookie).toContain('Expires=')
  })
})

describe('authCookie.deleteSession', () => {
  it('clears the cookie', async () => {
    // act
    const response = await call(writeApp, '/delete', `${sessionCookieName}=session-1`)

    // assert
    const setCookie = response.headers.getSetCookie().find((value) => value.startsWith(sessionCookieName))

    expect(setCookie).toContain(`${sessionCookieName}=`)
    expect(setCookie).toContain('Max-Age=0')
  })
})
