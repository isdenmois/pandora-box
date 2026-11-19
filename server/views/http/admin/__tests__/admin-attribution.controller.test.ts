import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@server/infra', () => ({
  attributionRepository: { getGlobal: vi.fn(), reassign: vi.fn() },
  backupRepository: { create: vi.fn(), restore: vi.fn() },
  importRepository: { import: vi.fn(), status: vi.fn() },
  movieRepository: { allIds: vi.fn() },
  OFFSITE_RETENTION: 14,
  offsiteConfigured: false,
  offsiteKey: () => '2026-11-18',
  offsiteRepository: { list: vi.fn(), put: vi.fn(), prune: vi.fn() },
  posterRepository: { removeOrphans: vi.fn() },
  seriesRepository: { allIds: vi.fn() },
  sessionRepository: { getById: vi.fn(), delete: vi.fn() },
  userRepository: { exists: vi.fn() },
}))

vi.mock('@server/views/auth', async () => {
  const { createMiddleware } = await import('hono/factory')

  return {
    requireAdmin: createMiddleware(async (c, next) => {
      c.set('user', { id: 'admin', role: 'admin', username: 'root' })
      await next()
    }),
  }
})

const { attributionRepository, userRepository } = await import('@server/infra')
const { adminController } = await import('../admin.controller')

const handle = (request: Request) => adminController.request(request)

const request = (method: string, body?: unknown) =>
  new Request('http://localhost/attribution', {
    method,
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })

describe('admin attribution', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(userRepository.exists).mockResolvedValue(true)
    vi.mocked(attributionRepository.reassign).mockResolvedValue({ ok: true, updated: 1 })
  })

  it('lists only the shared rows', async () => {
    // arrange
    vi.mocked(attributionRepository.getGlobal).mockResolvedValue({ movies: [], series: [] })

    // act
    const response = await handle(request('GET'))

    // assert
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ movies: [], series: [] })
  })

  it('rejects a request with no records', async () => {
    // act
    const response = await handle(request('PATCH', { createdBy: 'user-2' }))

    // assert
    expect(response.status).toBe(422)
    expect(attributionRepository.reassign).not.toHaveBeenCalled()
  })

  it('rejects an unknown target creator', async () => {
    // arrange
    vi.mocked(userRepository.exists).mockResolvedValue(false)

    // act
    const response = await handle(request('PATCH', { movies: ['movie-1'], createdBy: 'ghost' }))

    // assert
    expect(response.status).toBe(422)
    expect(attributionRepository.reassign).not.toHaveBeenCalled()
  })

  it('answers 409 when a selected row became private or missing', async () => {
    // arrange
    vi.mocked(attributionRepository.reassign).mockResolvedValue({ ok: false, reason: 'unavailable' })

    // act
    const response = await handle(request('PATCH', { movies: ['movie-1'], createdBy: 'user-2' }))

    // assert
    expect(response.status).toBe(409)
  })

  it('reassigns the selected rows', async () => {
    // act
    const response = await handle(request('PATCH', { movies: ['movie-1'], series: ['series-1'], createdBy: 'user-2' }))

    // assert
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ updated: 1 })
    expect(attributionRepository.reassign).toHaveBeenCalledExactlyOnceWith({
      movies: ['movie-1'],
      series: ['series-1'],
      createdBy: 'user-2',
    })
  })
})
