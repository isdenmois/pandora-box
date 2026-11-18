import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// The importer sleeps 5 s per item to respect OMDB's rate limit; e2e must not wait for it.
vi.mock('@/shared', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared')>()),
  sleep: vi.fn(() => Promise.resolve()),
}))

import { request, resetDatabase, seedSession } from '../support/api'
import { moviePayload } from '../support/records'

/** OMDB answers by imdb id; the importer only asks `?i=<extId>`. */
function omdbStub(input: RequestInfo | URL) {
  const url = new URL(input instanceof Request ? input.url : String(input))
  const id = url.searchParams.get('i')
  const payload =
    id === 'tt2'
      ? { imdbID: id, Title: 'Imported Series', Type: 'series', Year: '2001', Poster: '', Response: 'True' }
      : {
          imdbID: id,
          Title: 'Imported Movie',
          Type: 'movie',
          Year: '1999',
          Poster: '',
          imdbRating: '7.5',
          Genre: 'Drama',
          Language: 'English',
          Response: 'True',
        }

  return Promise.resolve(
    new Response(JSON.stringify(payload), { status: 200, headers: { 'content-type': 'application/json' } }),
  )
}

describe('server e2e: import', () => {
  beforeEach(resetDatabase)

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('is admin-only', async () => {
    // arrange
    const alice = await seedSession('alice')

    // act
    const response = await request({
      method: 'POST',
      path: '/v1/admin/import',
      cookie: alice.cookie,
      body: { movies: [], series: [] },
    })

    // assert
    expect(response.status).toBe(401)
  })

  it('creates imported rows for the importer and ignores the legacy userId', async () => {
    // arrange
    const admin = await seedSession('root', { role: 'admin' })
    vi.stubGlobal('fetch', vi.fn(omdbStub))

    // act
    const imported = await request({
      method: 'POST',
      path: '/v1/admin/import',
      cookie: admin.cookie,
      body: {
        movies: [{ extId: 'tt1', reason: 'from the old install', userId: 'ghost' }],
        series: [{ extId: 'tt2', season: 2 }],
      },
    })
    const movies = await request<{ title: string; createdBy: string; reason: string }[]>({
      path: '/v1/movie',
      cookie: admin.cookie,
    })
    const series = await request<{ title: string; createdBy: string; season: number }[]>({
      path: '/v1/series',
      cookie: admin.cookie,
    })

    // assert
    expect(imported.status).toBe(200)
    expect(movies.body).toMatchObject([
      { title: 'Imported Movie', createdBy: admin.id, reason: 'from the old install' },
    ])
    expect(series.body).toMatchObject([{ title: 'Imported Series', createdBy: admin.id, season: 2 }])
  })

  it('keeps the existing creator on a re-import', async () => {
    // arrange
    const admin = await seedSession('root', { role: 'admin' })
    const alice = await seedSession('alice')
    await request({
      method: 'POST',
      path: '/v1/movie',
      cookie: alice.cookie,
      body: moviePayload({ extId: 'tt3', title: 'Already Here', provider: 'omdb' }),
    })
    const fetchMock = vi.fn(omdbStub)
    vi.stubGlobal('fetch', fetchMock)

    // act
    const imported = await request({
      method: 'POST',
      path: '/v1/admin/import',
      cookie: admin.cookie,
      body: { movies: [{ extId: 'tt3', reason: 'updated reason' }], series: [] },
    })
    const movies = await request<{ createdBy: string; reason: string }[]>({
      path: '/v1/movie',
      cookie: alice.cookie,
    })

    // assert
    expect(imported.status).toBe(200)
    expect(movies.body).toMatchObject([{ createdBy: alice.id, reason: 'updated reason' }])
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
