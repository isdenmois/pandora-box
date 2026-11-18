import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/app', () => ({ offsiteUC: { list: vi.fn(), upload: vi.fn() } }))

// The guard is covered on its own; here only the handler matters.
vi.mock('@/views/auth', async () => {
  const { Elysia } = await import('elysia')

  return { backupTokenGuard: new Elysia({ name: 'backup token guard' }) }
})

const { offsiteUC } = await import('@/app')
const { offsiteController } = await import('../backup-offsite.controller')

type Handler = (request: Request) => Promise<Response>
const handle = offsiteController.handle as unknown as Handler

const post = () => new Request('http://localhost/v1/backup/offsite', { method: 'POST' })

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
    expect(await response.json()).toEqual({ message: 'Permission denied' })
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
