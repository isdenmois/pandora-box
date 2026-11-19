import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@server/app', () => ({ offsiteUC: { list: vi.fn(), upload: vi.fn() } }))

// The guard is covered on its own; here only the handler matters.
vi.mock('@server/views/auth', async () => {
  const { createMiddleware } = await import('hono/factory')

  return { backupTokenGuard: createMiddleware(async (_c, next) => next()) }
})

const { offsiteUC } = await import('@server/app')
const { offsiteController } = await import('../backup-offsite.controller')

const handle = (request: Request) => offsiteController.request(request)

const post = () => new Request('http://localhost/offsite', { method: 'POST' })

describe('offsite backup route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('answers 201 with what landed', async () => {
    // arrange
    vi.mocked(offsiteUC.upload).mockResolvedValue({ ok: true, key: '2026-11-18', bytes: 512, pruned: ['2026-11-04'] })

    // act
    const response = await handle(post())

    // assert
    expect(response.status).toBe(201)
    expect(await response.json()).toEqual({ key: '2026-11-18', bytes: 512, pruned: ['2026-11-04'] })
  })

  it('answers 502 when Firebase rejects the upload', async () => {
    // arrange
    vi.mocked(offsiteUC.upload).mockResolvedValue({ ok: false, reason: 'failed', message: 'Permission denied' })

    // act
    const response = await handle(post())

    // assert
    expect(response.status).toBe(502)
    expect(await response.json()).toEqual({ error: { code: 'upstream', message: 'Permission denied' } })
  })

  it('answers 503 when the feature has no credentials', async () => {
    // arrange
    vi.mocked(offsiteUC.upload).mockResolvedValue({
      ok: false,
      reason: 'not-configured',
      message: 'Offsite backup is not configured',
    })

    // act
    const response = await handle(post())

    // assert
    expect(response.status).toBe(503)
  })
})
