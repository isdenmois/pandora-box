import { beforeEach, describe, expect, it, vi } from 'vitest'
import { movie } from '../movie-api'

const chain = vi.hoisted(() => {
  const fake = {
    post: vi.fn(),
    patch: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
    url: vi.fn(),
    json: vi.fn(),
    text: vi.fn(),
  }

  fake.post.mockReturnValue(fake)
  fake.patch.mockReturnValue(fake)
  fake.get.mockReturnValue(fake)
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

describe('movie api', () => {
  it('savePoster sends the fields and the file as multipart form data', async () => {
    // arrange
    const data = { title: 'Some Movie' }
    const file = new File([new Uint8Array([1])], 'poster.png', { type: 'image/png' })

    // act
    await movie.savePoster('movie-1', data, file)

    // assert
    expect(chain.url).toHaveBeenCalledExactlyOnceWith('/movie-1/poster')

    const body = chain.patch.mock.calls[0]?.[0] as FormData

    expect(body).toBeInstanceOf(FormData)
    expect(body.get('data')).toBe(JSON.stringify(data))
    expect(body.get('file')).toBe(file)
    expect(body.has('poster')).toBe(false)
    expect(chain.json).toHaveBeenCalledOnce()
  })

  it('patch sends the data object to the row url', async () => {
    // arrange
    const data = { title: 'Some Movie', rating: 8 }

    // act
    await movie.patch('movie-1', data)

    // assert
    expect(chain.url).toHaveBeenCalledExactlyOnceWith('/movie-1')
    expect(chain.patch).toHaveBeenCalledExactlyOnceWith(data)
    expect(chain.json).toHaveBeenCalledOnce()
  })

  it('delete sends a DELETE to the row url', async () => {
    // arrange
    // act
    await movie.delete('movie-1')

    // assert
    expect(chain.url).toHaveBeenCalledExactlyOnceWith('/movie-1')
    expect(chain.delete).toHaveBeenCalledOnce()
    expect(chain.text).toHaveBeenCalledOnce()
  })
})
