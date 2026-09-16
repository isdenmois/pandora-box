import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SESSION_EXPIRE_IN, type Session } from '@/domain'
import { sessionRepository } from '@/infra'
import { validate } from '../validate'

vi.mock('@/infra', () => ({
  sessionRepository: { getById: vi.fn(), delete: vi.fn() },
}))

const user = { id: 'user-1', role: 'user', username: 'john' } as const

function createSession(expiresAt: Date): Session {
  return {
    id: 'session-id',
    userId: user.id,
    expiresAt,
  }
}

describe('session validate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns session and user when the session is valid', async () => {
    // arrange
    const session = createSession(new Date(Date.now() + SESSION_EXPIRE_IN))
    vi.mocked(sessionRepository.getById).mockResolvedValue({ session, user })

    // act
    const result = await validate(session.id)

    // assert
    expect(result).toEqual({ session, user })
    expect(sessionRepository.getById).toHaveBeenCalledExactlyOnceWith(session.id)
    expect(sessionRepository.delete).not.toHaveBeenCalled()
  })

  it('deletes and rejects an expired session', async () => {
    // arrange
    const session = createSession(new Date(Date.now() - 1))
    vi.mocked(sessionRepository.getById).mockResolvedValue({ session, user })

    // act
    const result = await validate(session.id)

    // assert
    expect(result).toEqual({ session: null, user: null })
    expect(sessionRepository.delete).toHaveBeenCalledExactlyOnceWith(session.id)
  })

  it('returns nulls for an unknown session id', async () => {
    // arrange
    vi.mocked(sessionRepository.getById).mockResolvedValue(undefined)

    // act
    const result = await validate('unknown-session-id')

    // assert
    expect(result).toEqual({ session: null, user: null })
    expect(sessionRepository.delete).not.toHaveBeenCalled()
  })
})
