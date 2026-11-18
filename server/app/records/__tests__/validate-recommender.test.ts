import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/infra', () => ({
  userRepository: { exists: vi.fn() },
}))

const { userRepository } = await import('@/infra')
const { isValidRecommender } = await import('../validate-recommender')

describe('isValidRecommender', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('accepts an absent recommender', async () => {
    // arrange
    // act
    const valid = await isValidRecommender(null, 'creator')

    // assert
    expect(valid).toBe(true)
    expect(userRepository.exists).not.toHaveBeenCalled()
  })

  it('rejects the creator recommending their own row', async () => {
    // arrange
    // act
    const valid = await isValidRecommender('creator', 'creator')

    // assert
    expect(valid).toBe(false)
    expect(userRepository.exists).not.toHaveBeenCalled()
  })

  it('rejects an id that is not a user', async () => {
    // arrange
    vi.mocked(userRepository.exists).mockResolvedValue(false)

    // act
    const valid = await isValidRecommender('ghost', 'creator')

    // assert
    expect(valid).toBe(false)
  })

  it('accepts a real other user', async () => {
    // arrange
    vi.mocked(userRepository.exists).mockResolvedValue(true)

    // act
    const valid = await isValidRecommender('other', 'creator')

    // assert
    expect(valid).toBe(true)
    expect(userRepository.exists).toHaveBeenCalledExactlyOnceWith('other')
  })
})
