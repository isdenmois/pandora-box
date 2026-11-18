import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/app', () => ({
  admin: { registerUser: vi.fn() },
  offsiteUC: { list: vi.fn(), upload: vi.fn() },
}))

vi.mock('@/infra', () => ({
  attributionRepository: { getGlobal: vi.fn(), reassign: vi.fn() },
  backupRepository: { create: vi.fn(), restore: vi.fn() },
  importRepository: { import: vi.fn(), status: vi.fn() },
  movieRepository: { allIds: vi.fn() },
  OFFSITE_RETENTION: 14,
  posterRepository: { removeOrphans: vi.fn() },
  seriesRepository: { allIds: vi.fn() },
  userRepository: { exists: vi.fn() },
}))

vi.mock('@/views/auth', async () => {
  const { Elysia } = await import('elysia')

  return {
    adminGuard: new Elysia({ name: 'admin guard' }).derive({ as: 'scoped' }, () => ({
      user: { id: 'admin', role: 'admin' },
    })),
  }
})

const { offsiteUC } = await import('@/app')
const { adminController } = await import('../admin.controller')

type Handler = (request: Request) => Promise<Response>
const handle = adminController.handle as unknown as Handler

const call = (method: string) => handle(new Request('http://localhost/v1/admin/backup/offsite', { method }))

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
