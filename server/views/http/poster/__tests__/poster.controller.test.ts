import { describe, expect, it, vi } from 'vitest'

// The controller module also builds the production instance, which reaches the database through
// `@server/infra`; stubbing both keeps these tests free of bun:sqlite.
vi.mock('@server/infra', () => ({
  posterRepository: { remove: vi.fn() },
}))

// The guard is middleware; a stub is enough to let requests in.
vi.mock('@server/views/auth', async () => {
  const { createMiddleware } = await import('hono/factory')

  return {
    requireAuth: createMiddleware(async (c, next) => {
      c.set('user', { id: 'user-1', role: 'user', username: 'user-1' })
      await next()
    }),
  }
})

const { createPosterController } = await import('../poster.controller')

const ID = 'movie-1'
const SOURCE = 'https://cdn.example.com/poster.jpg'

function setup(overrides: Partial<Parameters<typeof createPosterController>[0]> = {}) {
  const deps = {
    findRow: vi.fn(async () => ({
      poster: `/images/${ID}.jpg`,
      posterSource: SOURCE,
      private: false,
      createdBy: 'user-1',
    })),
    remove: vi.fn(async () => {}),
    ...overrides,
  }

  const app = createPosterController(deps)

  return { deps, handle: (request: Request) => app.request(request) }
}

const redownload = () => new Request(`http://localhost/${ID}`, { method: 'DELETE' })

describe('DELETE /v1/poster/:id', () => {
  it('drops the stored file and answers with the unchanged row', async () => {
    // arrange
    const { deps, handle } = setup()

    // act
    const response = await handle(redownload())

    // assert
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      poster: `/images/${ID}.jpg`,
      posterSource: SOURCE,
      private: false,
      createdBy: 'user-1',
    })
    expect(deps.remove).toHaveBeenCalledWith(ID)
  })

  it('answers 404 for an id that no record holds', async () => {
    // arrange
    const { deps, handle } = setup({ findRow: vi.fn(async () => null) })

    // act
    const response = await handle(redownload())

    // assert
    expect(response.status).toBe(404)
    expect(deps.remove).not.toHaveBeenCalled()
  })

  it('refuses to drop a poster that has no source to download it from', async () => {
    // arrange
    const { deps, handle } = setup({
      findRow: vi.fn(async () => ({
        poster: `/images/${ID}.jpg`,
        posterSource: null,
        private: false,
        createdBy: 'user-1',
      })),
    })

    // act
    const response = await handle(redownload())

    // assert
    // The file is the only copy of a manual poster; deleting it would lose the image for good.
    expect(response.status).toBe(409)
    expect(deps.remove).not.toHaveBeenCalled()
  })

  it("answers 404 for another user's private row", async () => {
    // arrange
    const { deps, handle } = setup({
      findRow: vi.fn(async () => ({
        poster: `/images/${ID}.jpg`,
        posterSource: SOURCE,
        private: true,
        createdBy: 'someone-else',
      })),
    })

    // act
    const response = await handle(redownload())

    // assert
    expect(response.status).toBe(404)
    expect(deps.remove).not.toHaveBeenCalled()
  })
})
