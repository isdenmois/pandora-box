import { describe, expect, it, vi } from 'vitest'

// The controller module also builds the production instance, which reaches the database through
// `@/infra`; stubbing both keeps these tests free of bun:sqlite.
vi.mock('@/infra', () => ({
  posterRepository: { remove: vi.fn() },
}))

// The guard is a plugin, so the stub has to be one too — a `derive` is enough to let requests in.
vi.mock('@/views/auth', async () => {
  const { Elysia } = await import('elysia')

  return { authGuard: new Elysia({ name: 'auth guard' }).derive(() => ({ user: { id: 'user-1' } })) }
})

const { createPosterController } = await import('../poster.controller')

const ID = 'movie-1'
const SOURCE = 'https://cdn.example.com/poster.jpg'

type Handler = (request: Request) => Promise<Response>

function setup(overrides: Partial<Parameters<typeof createPosterController>[0]> = {}) {
  const deps = {
    findRow: vi.fn(async () => ({ poster: `/images/${ID}.jpg`, posterSource: SOURCE })),
    remove: vi.fn(async () => {}),
    ...overrides,
  }

  const app = createPosterController(deps)

  return { deps, handle: app.handle as unknown as Handler }
}

const redownload = () => new Request(`http://localhost/v1/poster/${ID}`, { method: 'DELETE' })

describe('DELETE /v1/poster/:id', () => {
  it('drops the stored file and answers with the unchanged row', async () => {
    // arrange
    const { deps, handle } = setup()

    // act
    const response = await handle(redownload())

    // assert
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ poster: `/images/${ID}.jpg`, posterSource: SOURCE })
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
      findRow: vi.fn(async () => ({ poster: `/images/${ID}.jpg`, posterSource: null })),
    })

    // act
    const response = await handle(redownload())

    // assert
    // The file is the only copy of a manual poster; deleting it would lose the image for good.
    expect(response.status).toBe(409)
    expect(deps.remove).not.toHaveBeenCalled()
  })
})
