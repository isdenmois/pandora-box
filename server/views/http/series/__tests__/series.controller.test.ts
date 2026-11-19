import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@server/infra', () => ({
  env: { IMAGE_MAX_BYTES: 5 * 1024 * 1024 },
  seriesRepository: {
    create: vi.fn(),
    byId: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    markAsViewed: vi.fn(),
    removeSeriesView: vi.fn(),
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

const { seriesRepository, posterRepository, userRepository } = await import('@server/infra')
const { seriesController } = await import('../series.controller')

const OWN_ROW = {
  id: 'series-1',
  title: 'Mine',
  createdBy: 'reader',
  recommendedBy: null,
  private: true,
  poster: null,
  posterSource: null,
  season: 1,
}
const OTHER_PRIVATE = { ...OWN_ROW, id: 'series-2', createdBy: 'someone-else' }
const OTHER_GLOBAL = { ...OTHER_PRIVATE, private: false }

const BODY = {
  extId: 'tt1',
  provider: 'omdb',
  title: 'A Series',
  poster: null,
  year: null,
  season: 1,
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

const handle = (request: Request) => seriesController.request(request)

const request = (path: string, method = 'GET', body?: unknown) =>
  new Request(`http://localhost${path || '/'}`, {
    method,
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })

/** A header-only png; authorization runs before the bytes are sniffed, so the stub is enough. */
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

function upload(id: string, data: unknown = { title: 'Renamed' }) {
  const form = new FormData()

  form.append('data', JSON.stringify(data))
  form.append('file', new File([PNG], 'p.png', { type: 'image/png' }))

  return new Request(`http://localhost/${id}/poster`, { method: 'PATCH', body: form })
}

describe('series ownership rules', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(seriesRepository.create).mockResolvedValue(OWN_ROW as never)
    vi.mocked(seriesRepository.byId).mockResolvedValue(OWN_ROW as never)
    vi.mocked(seriesRepository.update).mockResolvedValue(OWN_ROW as never)
    vi.mocked(seriesRepository.delete).mockResolvedValue()
    vi.mocked(seriesRepository.markAsViewed).mockResolvedValue({ id: 'view-1' } as never)
    vi.mocked(seriesRepository.removeSeriesView).mockResolvedValue()
    vi.mocked(seriesRepository.getAll).mockResolvedValue([])
    vi.mocked(seriesRepository.getViews).mockResolvedValue([])
    vi.mocked(posterRepository.save).mockResolvedValue('series-1.png')
    vi.mocked(posterRepository.remove).mockResolvedValue()
    vi.mocked(userRepository.exists).mockResolvedValue(true)
  })

  it('sets the creator from the session, never from the body', async () => {
    // arrange
    // act
    const response = await handle(request('', 'POST', { ...BODY, createdBy: 'attacker' }))

    // assert
    expect(response.status).toBe(200)
    expect(seriesRepository.create).toHaveBeenCalledExactlyOnceWith(
      expect.not.objectContaining({ createdBy: 'attacker' }),
      'reader',
    )
    expect(seriesRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'A Series', season: 1 }),
      'reader',
    )
  })

  it('rejects recommending yourself', async () => {
    // arrange
    // act
    const response = await handle(request('', 'POST', { ...BODY, recommendedBy: 'reader' }))

    // assert
    expect(response.status).toBe(422)
    expect(await response.json()).toEqual({ error: { code: 'validation', message: 'Unknown or invalid recommender' } })
    expect(seriesRepository.create).not.toHaveBeenCalled()
    expect(userRepository.exists).not.toHaveBeenCalled()
  })

  it('accepts a real other recommender', async () => {
    // arrange
    // act
    const response = await handle(request('', 'POST', { ...BODY, recommendedBy: 'other' }))

    // assert
    expect(response.status).toBe(200)
    expect(userRepository.exists).toHaveBeenCalledExactlyOnceWith('other')
    expect(seriesRepository.create).toHaveBeenCalledWith(expect.objectContaining({ recommendedBy: 'other' }), 'reader')
  })

  it('answers 404 when another user asks for a private row', async () => {
    // arrange
    vi.mocked(seriesRepository.byId).mockResolvedValue(OTHER_PRIVATE as never)

    // act
    const response = await handle(request('/series-2'))

    // assert
    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ error: { code: 'not_found', message: 'Not found' } })
  })

  it('answers 200 when the creator asks for their private row', async () => {
    // arrange
    // act
    const response = await handle(request('/series-1'))

    // assert
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual(OWN_ROW)
  })

  it('answers 200 for a global row owned by someone else', async () => {
    // arrange
    vi.mocked(seriesRepository.byId).mockResolvedValue(OTHER_GLOBAL as never)

    // act
    const response = await handle(request('/series-2'))

    // assert
    expect(response.status).toBe(200)
  })

  it("refuses to delete another user's private row", async () => {
    // arrange
    vi.mocked(seriesRepository.byId).mockResolvedValue(OTHER_PRIVATE as never)

    // act
    const response = await handle(request('/series-2', 'DELETE'))

    // assert
    expect(response.status).toBe(404)
    expect(seriesRepository.delete).not.toHaveBeenCalled()
  })

  it('deletes my own row', async () => {
    // arrange
    // act
    const response = await handle(request('/series-1', 'DELETE'))

    // assert
    expect(response.status).toBe(200)
    expect(seriesRepository.delete).toHaveBeenCalledExactlyOnceWith('series-1')
  })

  it('lets any user edit a global row', async () => {
    // arrange
    vi.mocked(seriesRepository.byId).mockResolvedValue(OTHER_GLOBAL as never)

    // act
    const response = await handle(request('/series-2', 'PATCH', { title: 'Fixed' }))

    // assert
    expect(response.status).toBe(200)
    expect(seriesRepository.update).toHaveBeenCalledExactlyOnceWith('series-2', { title: 'Fixed' }, undefined, 'reader')
  })

  it('validates the recommender on update', async () => {
    // arrange
    vi.mocked(seriesRepository.byId).mockResolvedValue(OTHER_GLOBAL as never)
    vi.mocked(userRepository.exists).mockResolvedValue(false)

    // act
    const response = await handle(request('/series-2', 'PATCH', { recommendedBy: 'ghost' }))

    // assert
    expect(response.status).toBe(422)
    expect(await response.json()).toEqual({ error: { code: 'validation', message: 'Unknown or invalid recommender' } })
    expect(userRepository.exists).toHaveBeenCalledExactlyOnceWith('ghost')
    expect(seriesRepository.update).not.toHaveBeenCalled()
  })

  it('passes season and season history through to the repository', async () => {
    // arrange
    const seasonHistory = [{ season: 1, episodes: 10 }]

    // act
    const response = await handle(request('/series-1', 'PATCH', { season: 2, seasonHistory }))

    // assert
    expect(response.status).toBe(200)
    expect(seriesRepository.update).toHaveBeenCalledExactlyOnceWith(
      'series-1',
      { season: 2, seasonHistory },
      undefined,
      'reader',
    )
  })

  it('lists only my private rows and every global row', async () => {
    // arrange
    // act
    const response = await handle(request(''))

    // assert
    expect(response.status).toBe(200)
    expect(seriesRepository.getAll).toHaveBeenCalledExactlyOnceWith('reader')
  })
})

describe('series viewing history', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(seriesRepository.byId).mockResolvedValue(OWN_ROW as never)
    vi.mocked(seriesRepository.markAsViewed).mockResolvedValue({ id: 'view-1' } as never)
    vi.mocked(seriesRepository.removeSeriesView).mockResolvedValue()
    vi.mocked(seriesRepository.getViews).mockResolvedValue([])
  })

  it('records a view on a visible row', async () => {
    // arrange
    const body = { date: '2024-05-01', rating: 8, comment: 'Strong finish' }

    // act
    const response = await handle(request('/series-1/viewed', 'POST', body))

    // assert
    expect(response.status).toBe(200)
    expect(seriesRepository.markAsViewed).toHaveBeenCalledExactlyOnceWith(
      'series-1',
      'reader',
      '2024-05-01',
      8,
      'Strong finish',
    )
  })

  it('answers 404 when another user marks a private row as viewed', async () => {
    // arrange
    vi.mocked(seriesRepository.byId).mockResolvedValue(OTHER_PRIVATE as never)

    // act
    const response = await handle(request('/series-2/viewed', 'POST', { date: '2024-05-01', rating: 8, comment: '' }))

    // assert
    expect(response.status).toBe(404)
    expect(seriesRepository.markAsViewed).not.toHaveBeenCalled()
  })

  it('removes the view of a visible row', async () => {
    // arrange
    // act
    const response = await handle(request('/series-1/view', 'DELETE'))

    // assert
    expect(response.status).toBe(200)
    expect(seriesRepository.removeSeriesView).toHaveBeenCalledExactlyOnceWith('series-1')
  })

  it('answers 404 when another user removes a view from a private row', async () => {
    // arrange
    vi.mocked(seriesRepository.byId).mockResolvedValue(OTHER_PRIVATE as never)

    // act
    const response = await handle(request('/series-2/view', 'DELETE'))

    // assert
    expect(response.status).toBe(404)
    expect(seriesRepository.removeSeriesView).not.toHaveBeenCalled()
  })

  it('lists views for the session user', async () => {
    // arrange
    // act
    const response = await handle(request('/views'))

    // assert
    expect(response.status).toBe(200)
    expect(seriesRepository.getViews).toHaveBeenCalledExactlyOnceWith('reader')
  })
})

describe('PATCH /v1/series/:id/poster', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(seriesRepository.byId).mockResolvedValue(OWN_ROW as never)
    vi.mocked(seriesRepository.update).mockResolvedValue(OWN_ROW as never)
    vi.mocked(posterRepository.save).mockResolvedValue('series-1.png')
    vi.mocked(posterRepository.remove).mockResolvedValue()
  })

  it("answers 404 for another user's private row and never saves a file", async () => {
    // arrange
    vi.mocked(seriesRepository.byId).mockResolvedValue(OTHER_PRIVATE as never)

    // act
    const response = await handle(upload('series-2'))

    // assert
    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ error: { code: 'not_found', message: 'Not found' } })
    expect(posterRepository.save).not.toHaveBeenCalled()
    expect(seriesRepository.update).not.toHaveBeenCalled()
  })
})
