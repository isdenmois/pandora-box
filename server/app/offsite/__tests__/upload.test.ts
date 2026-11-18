import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({ configured: true }))

vi.mock('@/infra', () => ({
  backupRepository: { create: vi.fn() },
  get offsiteConfigured() {
    return state.configured
  },
  offsiteKey: () => '2026-11-18',
  offsiteRepository: { list: vi.fn(), put: vi.fn(), prune: vi.fn() },
  OFFSITE_RETENTION: 14,
}))

const { backupRepository, offsiteRepository } = await import('@/infra')
const { upload } = await import('../upload')

const payload = { movie: [{ id: 'm1' }], user: [] }

describe('offsite upload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'info').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    state.configured = true
    vi.mocked(backupRepository.create).mockResolvedValue(payload as never)
    vi.mocked(offsiteRepository.put).mockResolvedValue(512)
    vi.mocked(offsiteRepository.prune).mockResolvedValue(['2026-11-04'])
  })

  it('does nothing while the feature is unconfigured', async () => {
    // arrange
    state.configured = false

    // act
    const result = await upload()

    // assert
    expect(result).toMatchObject({ ok: false, reason: 'not-configured' })
    expect(backupRepository.create).not.toHaveBeenCalled()
  })

  it('stores the snapshot under today and prunes the rest', async () => {
    // act
    const result = await upload()

    // assert
    expect(offsiteRepository.put).toHaveBeenCalledExactlyOnceWith('2026-11-18', payload)
    expect(offsiteRepository.prune).toHaveBeenCalledExactlyOnceWith(14)
    expect(result).toEqual({ ok: true, key: '2026-11-18', bytes: 512, pruned: ['2026-11-04'] })
  })

  it('keeps the run successful when only the prune fails', async () => {
    // arrange
    vi.mocked(offsiteRepository.prune).mockRejectedValue(new Error('network down'))

    // act
    const result = await upload()

    // assert
    expect(result).toEqual({ ok: true, key: '2026-11-18', bytes: 512, pruned: [] })
    expect(console.error).toHaveBeenCalled()
  })

  it('reports a failed upload instead of keeping a local copy', async () => {
    // arrange
    vi.mocked(offsiteRepository.put).mockRejectedValue(new Error('Permission denied'))

    // act
    const result = await upload()

    // assert
    expect(result).toEqual({ ok: false, reason: 'failed', message: 'Permission denied' })
  })
})
