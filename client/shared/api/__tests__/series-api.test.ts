import { beforeEach, describe, expect, it, vi } from 'vitest'
import { series } from '../series-api'

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

describe('series api', () => {
  it('targets the series collection', async () => {
    // arrange
    // act
    await series.getAll()

    // assert
    expect(chain.get).toHaveBeenCalledExactlyOnceWith()
    expect(chain.json).toHaveBeenCalledOnce()
  })

  it('savePoster sends the fields and the file as multipart form data', async () => {
    // arrange
    const data = { title: 'Some Series' }
    const file = new File([new Uint8Array([1])], 'poster.png', { type: 'image/png' })

    // act
    await series.savePoster('series-1', data, file)

    // assert
    expect(chain.url).toHaveBeenCalledExactlyOnceWith('/series-1/poster')

    const body = chain.patch.mock.calls[0]?.[0] as FormData

    expect(body).toBeInstanceOf(FormData)
    expect(body.get('data')).toBe(JSON.stringify(data))
    expect(body.get('file')).toBe(file)
    expect(body.has('poster')).toBe(false)
    expect(chain.json).toHaveBeenCalledOnce()
  })

  it('patch sends the data object to the row url', async () => {
    // arrange
    const data = { title: 'Some Series', season: 2 }

    // act
    await series.patch('series-1', data)

    // assert
    expect(chain.url).toHaveBeenCalledExactlyOnceWith('/series-1')
    expect(chain.patch).toHaveBeenCalledExactlyOnceWith(data)
    expect(chain.json).toHaveBeenCalledOnce()
  })

  it('delete sends a DELETE to the row url', async () => {
    // arrange
    // act
    await series.delete('series-1')

    // assert
    expect(chain.url).toHaveBeenCalledExactlyOnceWith('/series-1')
    expect(chain.delete).toHaveBeenCalledOnce()
    expect(chain.text).toHaveBeenCalledOnce()
  })

  it('markAsViewed posts the view to the viewed url', async () => {
    // arrange
    // act
    await series.markAsViewed('series-1', '2024-05-06', 8, 'Great')

    // assert
    expect(chain.url).toHaveBeenCalledExactlyOnceWith('/series-1/viewed')
    expect(chain.post).toHaveBeenCalledExactlyOnceWith({ date: '2024-05-06', rating: 8, comment: 'Great' })
    expect(chain.json).toHaveBeenCalledOnce()
  })

  it('removeSeriesView deletes the view url', async () => {
    // arrange
    // act
    await series.removeSeriesView('series-1')

    // assert
    expect(chain.url).toHaveBeenCalledExactlyOnceWith('/series-1/view')
    expect(chain.delete).toHaveBeenCalledOnce()
    expect(chain.text).toHaveBeenCalledOnce()
  })
})
