import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { series } from '../series-api'

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

describe('series api', () => {
  it('targets the series collection', async () => {
    // arrange
    fetchMock.mockResolvedValue(jsonResponse([]))

    // act
    const shows = await series.getAll()

    // assert
    expect(shows).toEqual([])
    expect(String(lastCall()[0])).toBe('/api/v1/series')
  })

  it('savePoster sends the fields and the file as multipart form data', async () => {
    // arrange
    const data = { title: 'Some Series' }
    const file = new File([new Uint8Array([1])], 'poster.png', { type: 'image/png' })
    fetchMock.mockResolvedValue(jsonResponse({ id: 'series-1', ...data }))

    // act
    await series.savePoster('series-1', data, file)

    // assert
    const [url, init] = lastCall()

    expect(String(url)).toBe('/api/v1/series/series-1/poster')
    expect(init.method).toBe('PATCH')
    expect(new Headers(init.headers).has('content-type')).toBe(false)

    const body = init.body as FormData

    expect(body).toBeInstanceOf(FormData)
    expect(body.get('data')).toBe(JSON.stringify(data))
    expect(body.get('file')).toBe(file)
    expect(body.has('poster')).toBe(false)
  })

  it('patch sends the data object to the row url', async () => {
    // arrange
    const data = { title: 'Some Series', season: 2 }
    fetchMock.mockResolvedValue(jsonResponse({ id: 'series-1', ...data }))

    // act
    await series.patch('series-1', data)

    // assert
    const [url, init] = lastCall()

    expect(String(url)).toBe('/api/v1/series/series-1')
    expect(init.method).toBe('PATCH')
    expect(JSON.parse(String(init.body))).toEqual(data)
  })

  it('delete sends a DELETE to the row url', async () => {
    // arrange
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }))

    // act
    await series.delete('series-1')

    // assert
    const [url, init] = lastCall()

    expect(String(url)).toBe('/api/v1/series/series-1')
    expect(init.method).toBe('DELETE')
  })

  it('markAsViewed posts the view to the viewed url', async () => {
    // arrange
    fetchMock.mockResolvedValue(jsonResponse({ id: 'view-1' }))

    // act
    await series.markAsViewed('series-1', '2024-05-06', 8, 'Great')

    // assert
    const [url, init] = lastCall()

    expect(String(url)).toBe('/api/v1/series/series-1/viewed')
    expect(init.method).toBe('POST')
    expect(JSON.parse(String(init.body))).toEqual({ date: '2024-05-06', rating: 8, comment: 'Great' })
  })

  it('removeSeriesView deletes the view url', async () => {
    // arrange
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }))

    // act
    await series.removeSeriesView('series-1')

    // assert
    const [url, init] = lastCall()

    expect(String(url)).toBe('/api/v1/series/series-1/view')
    expect(init.method).toBe('DELETE')
  })

  it('reads the view history from the static views path', async () => {
    // arrange
    fetchMock.mockResolvedValue(jsonResponse([]))

    // act
    await series.getViews()

    // assert
    expect(String(lastCall()[0])).toBe('/api/v1/series/views')
  })
})
