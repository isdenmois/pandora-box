import { afterEach, describe, expect, it, vi } from 'vitest'

const importIsMobile = async () => {
  const module = await import('../is-mobile')

  return module.isMobile
}

describe('is-mobile', () => {
  afterEach(() => {
    document.body.id = ''
    vi.unstubAllGlobals()
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('marks the body as mobile when the media query matches', async () => {
    // arrange
    const addEventListener = vi.fn()
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: true, addEventListener })),
    )
    vi.resetModules()

    // act
    const isMobile = await importIsMobile()

    // assert
    expect(isMobile.value).toBe(true)
    expect(document.body.id).toBe('mobile')
    expect(addEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })

  it('leaves the body unmarked when the media query does not match', async () => {
    // arrange
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: false, addEventListener: vi.fn() })),
    )
    vi.resetModules()

    // act
    const isMobile = await importIsMobile()

    // assert
    expect(isMobile.value).toBe(false)
    expect(document.body.id).toBe('')
  })

  it('defaults to false when matchMedia is unavailable', async () => {
    // arrange
    vi.stubGlobal('matchMedia', undefined)
    vi.resetModules()

    // act
    const isMobile = await importIsMobile()

    // assert
    expect(isMobile.value).toBe(false)
    expect(document.body.id).toBe('')
  })
})
