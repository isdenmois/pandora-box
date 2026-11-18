import type { Cookie } from 'elysia'
import { describe, expect, it, vi } from 'vitest'
import type { Session } from '@/domain'
import { authCookie, type Cookies, sessionCookieName } from '../auth-cookie'

const createCookies = (value: unknown): Cookies => {
  const cookie = {
    value,
    path: '',
    expires: undefined,
    httpOnly: false,
    remove: vi.fn(),
  } as unknown as Cookie<unknown>

  return { [sessionCookieName]: cookie }
}

const session: Session = {
  id: 'session-1',
  userId: 'user-1',
  expiresAt: new Date('2030-01-01T00:00:00Z'),
}

describe('authCookie.getSessionId', () => {
  it('returns the id stored in the cookie', () => {
    // arrange
    const cookies = createCookies('session-1')

    // act
    const id = authCookie.getSessionId(cookies)

    // assert
    expect(id).toBe('session-1')
  })

  it('returns null for an empty value', () => {
    // arrange
    const cookies = createCookies('')

    // act
    const id = authCookie.getSessionId(cookies)

    // assert
    expect(id).toBeNull()
  })

  it('returns null when the value is not a string', () => {
    // arrange
    const cookies = createCookies({ signed: 'session-1' })

    // act
    const id = authCookie.getSessionId(cookies)

    // assert
    expect(id).toBeNull()
  })
})

describe('authCookie.setSession', () => {
  it('stores the session id with the hardening flags', () => {
    // arrange
    const cookies = createCookies('')

    // act
    authCookie.setSession(cookies, session)

    // assert
    expect(cookies[sessionCookieName]).toMatchObject({
      value: 'session-1',
      path: '/',
      expires: session.expiresAt,
      httpOnly: true,
    })
  })
})

describe('authCookie.deleteSession', () => {
  it('removes the cookie and forgets it', () => {
    // arrange
    const cookies = createCookies('session-1')
    const cookie = cookies[sessionCookieName]

    // act
    authCookie.deleteSession(cookies)

    // assert
    expect(cookie.remove).toHaveBeenCalledOnce()
    expect(cookies).not.toHaveProperty(sessionCookieName)
  })
})
