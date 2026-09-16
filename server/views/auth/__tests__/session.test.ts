import type { Cookie } from 'elysia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { sessionUC } from '@/app'
import { SESSION_EXPIRE_IN, type Session } from '@/domain'
import { sessionRepository } from '@/infra'
import { type Cookies, sessionCookieName } from '../auth-cookie'
import { getSession } from '../session'

vi.mock('@/app', () => ({
  sessionUC: { validate: vi.fn() },
}))

vi.mock('@/infra', () => ({
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

function createCookies(sessionId: string | null): Cookies {
  // Elysia instantiates cookie objects on access, so the object always exists
  const cookie = {
    value: sessionId ?? '',
    remove: vi.fn(),
  } as unknown as Cookie<string>

  return { [sessionCookieName]: cookie }
}

describe('getSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not rotate a fresh session', async () => {
    // arrange
    const session = createSession(0)
    vi.mocked(sessionUC.validate).mockResolvedValue({ session, user })

    const cookies = createCookies(session.id)

    // act
    const result = await getSession(cookies)

    // assert
    expect(result).toEqual({ session, user })
    expect(sessionRepository.create).not.toHaveBeenCalled()
    expect(sessionRepository.delete).not.toHaveBeenCalled()
    expect(cookies[sessionCookieName].value).toBe(session.id)
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

    const cookies = createCookies(session.id)

    // act
    const result = await getSession(cookies)

    // assert
    expect(sessionRepository.create).toHaveBeenCalledExactlyOnceWith(user.id)
    // The cookie must point to the new session — not to the deleted old one
    expect(cookies[sessionCookieName].value).toBe(newSession.id)
    expect(cookies[sessionCookieName].expires).toEqual(newSession.expiresAt)
    // Object.assign in rotateSession mutates the session fixture, so capture the id beforehand
    expect(sessionRepository.delete).toHaveBeenCalledExactlyOnceWith('old-session-id')
    expect(result.session?.id).toBe(newSession.id)
    expect(result.user).toEqual(user)
  })

  it('returns nulls and does not rotate when the session is invalid', async () => {
    // arrange
    vi.mocked(sessionUC.validate).mockResolvedValue({ session: null, user: null })

    const cookies = createCookies('unknown-session-id')

    // act
    const result = await getSession(cookies)

    // assert
    expect(result).toEqual({ session: null, user: null })
    expect(sessionRepository.create).not.toHaveBeenCalled()
    expect(sessionRepository.delete).not.toHaveBeenCalled()
  })

  it('returns nulls when no session cookie is present', async () => {
    // arrange
    const cookies = createCookies(null)

    // act
    const result = await getSession(cookies)

    // assert
    expect(result).toEqual({ session: null, user: null })
    expect(sessionUC.validate).not.toHaveBeenCalled()
  })
})
