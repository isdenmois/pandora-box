import { sessionUC } from '@server/app'
import { SESSION_EXPIRE_IN, type Session } from '@server/domain'
import { sessionRepository } from '@server/infra'
import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { sessionCookieName } from '../auth-cookie'
import { getSession } from '../session'

vi.mock('@server/app', () => ({
  sessionUC: { validate: vi.fn() },
}))

vi.mock('@server/infra', () => ({
  sessionRepository: { create: vi.fn(), delete: vi.fn() },
}))

const DAY_IN_MS = 1000 * 60 * 60 * 24

const user = { id: 'user-1', role: 'user', username: 'john' } as const

function createSession(ageInDays: number): Session {
  return {
    id: 'old-session-id',
    userId: user.id,
    expiresAt: new Date(Date.now() + SESSION_EXPIRE_IN - ageInDays * DAY_IN_MS),
  }
}

const app = new Hono().get('/', async (c) => {
  const result = await getSession(c)

  return c.json({ sessionId: result.session?.id ?? null, user: result.user })
})

const call = (sessionId?: string) =>
  app.request('http://localhost/', {
    headers: sessionId ? { cookie: `${sessionCookieName}=${sessionId}` } : undefined,
  })

describe('getSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not rotate a fresh session', async () => {
    // arrange
    const session = createSession(0)
    vi.mocked(sessionUC.validate).mockResolvedValue({ session, user })

    // act
    const response = await call(session.id)

    // assert
    expect(await response.json()).toEqual({ sessionId: session.id, user })
    expect(response.headers.getSetCookie()).toEqual([])
    expect(sessionRepository.create).not.toHaveBeenCalled()
    expect(sessionRepository.delete).not.toHaveBeenCalled()
  })

  it('rotates a session older than 30 days and sets the cookie to the new session', async () => {
    // arrange
    const session = createSession(40)
    vi.mocked(sessionUC.validate).mockResolvedValue({ session, user })

    const newSession: Session = {
      id: 'new-session-id',
      userId: user.id,
      expiresAt: new Date(Date.now() + SESSION_EXPIRE_IN),
    }
    vi.mocked(sessionRepository.create).mockResolvedValue(newSession)

    // act
    const response = await call(session.id)

    // assert
    expect(sessionRepository.create).toHaveBeenCalledExactlyOnceWith(user.id)
    const setCookie = response.headers.getSetCookie().find((value) => value.startsWith(sessionCookieName))

    // The cookie must point to the new session — not to the deleted old one
    expect(setCookie).toContain(`${sessionCookieName}=${newSession.id}`)
    expect(setCookie).toContain('Expires=')
    // Object.assign in rotateSession mutates the session fixture, so capture the id beforehand
    expect(sessionRepository.delete).toHaveBeenCalledExactlyOnceWith('old-session-id')
    expect(await response.json()).toEqual({ sessionId: newSession.id, user })
  })

  it('returns nulls and does not rotate when the session is invalid', async () => {
    // arrange
    vi.mocked(sessionUC.validate).mockResolvedValue({ session: null, user: null })

    // act
    const response = await call('unknown-session-id')

    // assert
    expect(await response.json()).toEqual({ sessionId: null, user: null })
    expect(sessionRepository.create).not.toHaveBeenCalled()
    expect(sessionRepository.delete).not.toHaveBeenCalled()
  })

  it('returns nulls when no session cookie is present', async () => {
    // act
    const response = await call()

    // assert
    expect(await response.json()).toEqual({ sessionId: null, user: null })
    expect(sessionUC.validate).not.toHaveBeenCalled()
  })
})
