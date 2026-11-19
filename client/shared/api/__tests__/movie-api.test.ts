import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { movie } from '../movie-api'

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

const fetchMock = vi.fn()

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const lastCall = () => fetchMock.mock.calls.at(-1) as [string, RequestInit]

describe('movie api', () => {
  it('savePoster sends the fields and the file as multipart form data', async () => {
    // arrange
    const row = { id: 'movie-1', title: 'Some Movie' }
    const data = { title: 'Some Movie' }
    const file = new File([new Uint8Array([1])], 'poster.png', { type: 'image/png' })
    fetchMock.mockResolvedValue(jsonResponse(row))

    // act
    const saved = await movie.savePoster('movie-1', data, file)

    // assert
    expect(saved).toEqual(row)
    const [url, init] = lastCall()

    expect(String(url)).toBe('/api/v1/movie/movie-1/poster')
    expect(init.method).toBe('PATCH')
    // The boundary is generated from the FormData; setting it by hand breaks the parse.
    expect(new Headers(init.headers).has('content-type')).toBe(false)

    const body = init.body as FormData

    expect(body).toBeInstanceOf(FormData)
    expect(body.get('data')).toBe(JSON.stringify(data))
    expect(body.get('file')).toBe(file)
    expect(body.has('poster')).toBe(false)
  })

  it('patch sends the data object to the row url', async () => {
    // arrange
    const data = { title: 'Some Movie', rating: 8 }
    fetchMock.mockResolvedValue(jsonResponse({ id: 'movie-1', ...data }))

    // act
    await movie.patch('movie-1', data)

    // assert
    const [url, init] = lastCall()

    expect(String(url)).toBe('/api/v1/movie/movie-1')
    expect(init.method).toBe('PATCH')
    expect(new Headers(init.headers).get('content-type')).toContain('application/json')
    expect(JSON.parse(String(init.body))).toEqual(data)
  })

  it('delete sends a DELETE to the row url', async () => {
    // arrange
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }))

    // act
    await movie.delete('movie-1')

    // assert
    const [url, init] = lastCall()

    expect(String(url)).toBe('/api/v1/movie/movie-1')
    expect(init.method).toBe('DELETE')
  })

  it('lists the collection from the base url', async () => {
    // arrange
    fetchMock.mockResolvedValue(jsonResponse([]))

    // act
    const movies = await movie.getAll()

    // assert
    expect(movies).toEqual([])
    expect(String(lastCall()[0])).toBe('/api/v1/movie')
  })

  it('reads the view history from the static views path', async () => {
    // arrange
    fetchMock.mockResolvedValue(jsonResponse([]))

    // act
    await movie.getViews()

    // assert
    expect(String(lastCall()[0])).toBe('/api/v1/movie/views')
  })

  it('posts a view to the row viewed url', async () => {
    // arrange
    fetchMock.mockResolvedValue(jsonResponse({ id: 'view-1' }))

    // act
    await movie.markAsViewed('movie-1', '2024-05-06', 8, 'Great')

    // assert
    const [url, init] = lastCall()

    expect(String(url)).toBe('/api/v1/movie/movie-1/viewed')
    expect(init.method).toBe('POST')
    expect(JSON.parse(String(init.body))).toEqual({ date: '2024-05-06', rating: 8, comment: 'Great' })
  })

  it('removes the view from the row view url', async () => {
    // arrange
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }))

    // act
    await movie.removeMovieView('movie-1')

    // assert
    const [url, init] = lastCall()

    expect(String(url)).toBe('/api/v1/movie/movie-1/view')
    expect(init.method).toBe('DELETE')
  })
})
