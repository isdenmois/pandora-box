import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@server/infra', () => ({
  env: { IMAGE_MAX_BYTES: 5 * 1024 * 1024 },
  movieRepository: {
    create: vi.fn(),
    byId: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    markAsViewed: vi.fn(),
    removeMovieView: vi.fn(),
    getAll: vi.fn(),
    getViews: vi.fn(),
  },
  posterRepository: { save: vi.fn(), remove: vi.fn() },
  userRepository: { exists: vi.fn() },
}))

vi.mock('@server/views/auth', async () => {
  const { createMiddleware } = await import('hono/factory')

  return {
    requireAuth: createMiddleware(async (c, next) => {
      c.set('user', { id: 'reader', role: 'user', username: 'reader' })
      await next()
    }),
  }
})

const { movieRepository, userRepository } = await import('@server/infra')
const { movieController } = await import('../movie.controller')

const OWN_ROW = {
  id: 'movie-1',
  title: 'Mine',
  createdBy: 'reader',
  recommendedBy: null,
  private: true,
  poster: null,
  posterSource: null,
}
const OTHER_PRIVATE = { ...OWN_ROW, id: 'movie-2', createdBy: 'someone-else' }
const OTHER_GLOBAL = { ...OTHER_PRIVATE, private: false }

const BODY = {
  extId: 'tt1',
  provider: 'omdb',
  title: 'A Movie',
  poster: null,
  year: null,
  rating: null,
  language: null,
  genre: null,
  reason: null,
  recommendedBy: null,
  private: false,
  scheduled: null,
  tags: null,
  extra: {},
}

const handle = (request: Request) => movieController.request(request)

const request = (path: string, method = 'GET', body?: unknown) =>
  new Request(`http://localhost${path || '/'}`, {
    method,
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })

describe('movie ownership rules', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(movieRepository.create).mockResolvedValue(OWN_ROW as never)
    vi.mocked(movieRepository.byId).mockResolvedValue(OWN_ROW as never)
    vi.mocked(movieRepository.update).mockResolvedValue(OWN_ROW as never)
    vi.mocked(movieRepository.delete).mockResolvedValue()
    vi.mocked(movieRepository.getAll).mockResolvedValue([])
    vi.mocked(userRepository.exists).mockResolvedValue(true)
  })

  it('sets the creator from the session, never from the body', async () => {
    // act
    const response = await handle(request('', 'POST', { ...BODY, createdBy: 'someone-else' }))

    // assert
    expect(response.status).toBe(200)
    expect(movieRepository.create).toHaveBeenCalledExactlyOnceWith(
      expect.not.objectContaining({ createdBy: 'someone-else' }),
      'reader',
    )
  })

  it('rejects recommending yourself', async () => {
    // act
    const response = await handle(request('', 'POST', { ...BODY, recommendedBy: 'reader' }))

    // assert
    expect(response.status).toBe(422)
    expect(movieRepository.create).not.toHaveBeenCalled()
    expect(userRepository.exists).not.toHaveBeenCalled()
  })

  it('accepts a real other recommender', async () => {
    // act
    const response = await handle(request('', 'POST', { ...BODY, recommendedBy: 'other' }))

    // assert
    expect(response.status).toBe(200)
    expect(userRepository.exists).toHaveBeenCalledExactlyOnceWith('other')
  })

  it('answers 404 when another user asks for a private row', async () => {
    // arrange
    vi.mocked(movieRepository.byId).mockResolvedValue(OTHER_PRIVATE as never)

    // act
    const response = await handle(request('/movie-2'))

    // assert
    expect(response.status).toBe(404)
  })

  it('answers 200 when the creator asks for their private row', async () => {
    // act
    const response = await handle(request('/movie-1'))

    // assert
    expect(response.status).toBe(200)
  })

  it('answers 200 for a global row owned by someone else', async () => {
    // arrange
    vi.mocked(movieRepository.byId).mockResolvedValue(OTHER_GLOBAL as never)

    // act
    const response = await handle(request('/movie-2'))

    // assert
    expect(response.status).toBe(200)
  })

  it("refuses to delete another user's private row", async () => {
    // arrange
    vi.mocked(movieRepository.byId).mockResolvedValue(OTHER_PRIVATE as never)

    // act
    const response = await handle(request('/movie-2', 'DELETE'))

    // assert
    expect(response.status).toBe(404)
    expect(movieRepository.delete).not.toHaveBeenCalled()
  })

  it('lets any user edit a global row', async () => {
    // arrange
    vi.mocked(movieRepository.byId).mockResolvedValue(OTHER_GLOBAL as never)

    // act
    const response = await handle(request('/movie-2', 'PATCH', { title: 'Fixed' }))

    // assert
    expect(response.status).toBe(200)
    expect(movieRepository.update).toHaveBeenCalledExactlyOnceWith('movie-2', { title: 'Fixed' }, undefined, 'reader')
  })

  it('lists only my private rows and every global row', async () => {
    // act
    await handle(request(''))

    // assert
    expect(movieRepository.getAll).toHaveBeenCalledExactlyOnceWith('reader')
  })
})
