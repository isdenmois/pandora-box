import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@server/app', () => ({
  admin: { registerUser: vi.fn() },
  offsiteUC: { list: vi.fn(), upload: vi.fn() },
}))

vi.mock('@server/infra', () => ({
  attributionRepository: { getGlobal: vi.fn(), reassign: vi.fn() },
  backupRepository: { create: vi.fn(), restore: vi.fn() },
  importRepository: { import: vi.fn(), status: vi.fn() },
  movieRepository: { allIds: vi.fn() },
  OFFSITE_RETENTION: 14,
  posterRepository: { removeOrphans: vi.fn() },
  seriesRepository: { allIds: vi.fn() },
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

const { offsiteUC } = await import('@server/app')
const { adminController } = await import('../admin.controller')

const handle = (request: Request) => adminController.request(request)

const call = (method: string) => handle(new Request('http://localhost/backup/offsite', { method }))

describe('admin offsite backup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('lists the retained keys with the window size', async () => {
    // arrange
    vi.mocked(offsiteUC.list).mockResolvedValue(['2026-11-18', '2026-11-17'])

    // act
    const response = await call('GET')

    // assert
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ keys: ['2026-11-18', '2026-11-17'], retention: 14 })
  })

  it('answers 503 from the listing while unconfigured', async () => {
    // arrange
    vi.mocked(offsiteUC.list).mockResolvedValue(null)

    // act
    const response = await call('GET')

    // assert
    expect(response.status).toBe(503)
  })

  it('uploads on the admin route and reports what landed', async () => {
    // arrange
    vi.mocked(offsiteUC.upload).mockResolvedValue({ ok: true, key: '2026-11-18', bytes: 512, pruned: [] })

    // act
    const response = await call('POST')

    // assert
    expect(response.status).toBe(201)
    expect(await response.json()).toEqual({ key: '2026-11-18', bytes: 512, pruned: [] })
  })

  it('answers 502 when the upload fails', async () => {
    // arrange
    vi.mocked(offsiteUC.upload).mockResolvedValue({ ok: false, reason: 'failed', message: 'Permission denied' })

    // act
    const response = await call('POST')

    // assert
    expect(response.status).toBe(502)
  })
})
