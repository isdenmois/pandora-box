import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/infra', () => ({
  userRepository: { getByUsername: vi.fn() },
  sessionRepository: { create: vi.fn() },
}))

const { login } = await import('../login')
const { sessionRepository, userRepository } = await import('@/infra')
const { hashPassword } = await import('@/shared')

const storedUser = {
  id: 'user-1',
  username: 'john',
  role: 'user',
  age: null,
  passwordHash: hashPassword('secret'),
}

const session = {
  id: 'session-1',
  userId: storedUser.id,
  expiresAt: new Date('2030-01-01T00:00:00Z'),
}

describe('login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(userRepository.getByUsername).mockResolvedValue(storedUser)
    vi.mocked(sessionRepository.create).mockResolvedValue(session)
  })

  it('rejects an unknown username without creating a session', async () => {
    // arrange
    vi.mocked(userRepository.getByUsername).mockResolvedValue(undefined as never)

    // act
    const attempt = login('nobody', 'secret')

    // assert
    await expect(attempt).rejects.toBe('Incorrect username or password')
    expect(sessionRepository.create).not.toHaveBeenCalled()
  })

  it('rejects a wrong password without creating a session', async () => {
    // arrange

    // act
    const attempt = login('john', 'wrong')

    // assert
    await expect(attempt).rejects.toBe('Incorrect username or password')
    expect(sessionRepository.create).not.toHaveBeenCalled()
  })

  it('creates a session and returns the public user on success', async () => {
    // arrange

    // act
    const result = await login('john', 'secret')

    // assert
    expect(sessionRepository.create).toHaveBeenCalledExactlyOnceWith('user-1')
    expect(result).toEqual({
      session,
      user: { id: 'user-1', username: 'john', role: 'user' },
    })
    expect(result.user).not.toHaveProperty('passwordHash')
  })
})
