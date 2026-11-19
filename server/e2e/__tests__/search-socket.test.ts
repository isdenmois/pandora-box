import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { app } from '../../index'
import { resetDatabase, seedSession } from '../support/api'

/**
 * Bun's route table hands Elysia a `request.params` whose own properties cannot be redefined.
 * A route contract that carries defaults makes Elysia re-apply them to those params, which throws
 * — so these requests only break over a real socket, never through `app.handle`.
 */

const realFetch = globalThis.fetch

const searchResults = {
  Search: [
    { imdbID: 'tt0133093', Title: 'The Matrix', Type: 'movie', Year: '1999', Poster: 'N/A' },
    { imdbID: 'tt0234215', Title: 'The Matrix Reloaded', Type: 'movie', Year: '2003', Poster: 'N/A' },
  ],
}

function omdbStub(input: RequestInfo | URL) {
  const url = new URL(input instanceof Request ? input.url : String(input))
  const payload = url.searchParams.has('i')
    ? { imdbID: url.searchParams.get('i'), Title: 'The Matrix', Type: 'movie', Year: '1999', Poster: 'N/A' }
    : searchResults

  return Promise.resolve(
    new Response(JSON.stringify(payload), { status: 200, headers: { 'content-type': 'application/json' } }),
  )
}

let server: ReturnType<typeof app.listen>

describe('server e2e over a real socket: search', () => {
  beforeAll(() => {
    server = app.listen(0)
  })

  beforeEach(() => {
    vi.stubGlobal('fetch', (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(input instanceof Request ? input.url : String(input))

      return url.hostname === 'omdb.test' ? omdbStub(input) : realFetch(input, init)
    })

    return resetDatabase()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  afterAll(() => {
    server.stop()
  })

  it('searches an external provider by query', async () => {
    // arrange
    const alice = await seedSession('alice')

    // act
    const response = await fetch(`http://localhost:${server.server?.port}/api/v1/search/external/omdb?q=matrix`, {
      headers: { cookie: alice.cookie },
    })

    // assert
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual([
      { id: 'tt0133093', title: 'The Matrix', type: 'movie', poster: null, year: 1999 },
      { id: 'tt0234215', title: 'The Matrix Reloaded', type: 'movie', poster: null, year: 2003 },
    ])
  })

  it('finds a provider item by id', async () => {
    // arrange
    const alice = await seedSession('alice')

    // act
    const response = await fetch(`http://localhost:${server.server?.port}/api/v1/search/external/omdb/tt0133093`, {
      headers: { cookie: alice.cookie },
    })

    // assert
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      id: 'tt0133093',
      provider: 'omdb',
      title: 'The Matrix',
      type: 'movie',
      year: 1999,
      poster: null,
    })
  })
})
