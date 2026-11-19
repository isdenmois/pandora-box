import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { poster } from '../poster-api'

const fetchMock = vi.fn()

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('poster api', () => {
  it('redownload deletes the stored file for the record id', async () => {
    // arrange
    const row = { poster: '/images/movie-1.jpg', posterSource: null, private: false, createdBy: 'u1' }
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(row), { status: 200, headers: { 'content-type': 'application/json' } }),
    )

    // act
    const saved = await poster.redownload('movie-1')

    // assert
    expect(saved).toEqual(row)
    const [url, init] = fetchMock.mock.calls.at(-1) as [string, RequestInit]

    expect(String(url)).toBe('/api/v1/poster/movie-1')
    expect(init.method).toBe('DELETE')
  })
})
