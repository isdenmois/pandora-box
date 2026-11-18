import { beforeEach, describe, expect, it, vi } from 'vitest'
import { poster } from '../poster-api'

const chain = vi.hoisted(() => {
  const fake = {
    delete: vi.fn(),
    url: vi.fn(),
    json: vi.fn(),
  }

  fake.delete.mockReturnValue(fake)
  fake.url.mockReturnValue(fake)

  return fake
})

vi.mock('@/shared/api/http', () => ({
  http: { url: vi.fn(() => chain) },
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('poster api', () => {
  it('redownload deletes the stored file for the record id', async () => {
    // arrange
    // act
    await poster.redownload('movie-1')

    // assert
    expect(chain.url).toHaveBeenCalledExactlyOnceWith('/movie-1')
    expect(chain.delete).toHaveBeenCalledOnce()
    expect(chain.json).toHaveBeenCalledOnce()
  })
})
