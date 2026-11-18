import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { downloadBlob } from '../download-blob'

describe('downloadBlob', () => {
  let clicked: HTMLAnchorElement | null = null
  let click: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    clicked = null
    URL.createObjectURL = vi.fn(() => 'blob:backup')
    URL.revokeObjectURL = vi.fn()

    click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      clicked = this
    })
  })

  afterEach(() => {
    click.mockRestore()
  })

  it('clicks a link with the blob url and the given filename', () => {
    // arrange
    const blob = new Blob(['{"movies":[]}'], { type: 'application/json' })

    // act
    downloadBlob(blob, 'backup.json')

    // assert
    expect(URL.createObjectURL).toHaveBeenCalledExactlyOnceWith(blob)
    expect(clicked).not.toBeNull()
    expect(clicked?.href).toBe('blob:backup')
    expect(clicked?.download).toBe('backup.json')
  })

  it('removes the temporary link and releases the blob url', () => {
    // arrange
    // act
    downloadBlob(new Blob(['backup']), 'backup.json')

    // assert
    expect(clicked?.isConnected).toBe(false)
    expect(URL.revokeObjectURL).toHaveBeenCalledExactlyOnceWith('blob:backup')
  })
})
