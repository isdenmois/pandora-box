import { afterEach, describe, expect, it, vi } from 'vitest'
import { vShowPickerOnMount } from '../show-picker-on-mount'

describe('vShowPickerOnMount', () => {
  const input = document.createElement('input')
  const showPicker = vi.fn()

  afterEach(() => {
    showPicker.mockClear()
  })

  it('opens the native picker when the value is true', () => {
    // arrange
    input.showPicker = showPicker

    // act
    vShowPickerOnMount.mounted(input, { value: true })

    // assert
    expect(showPicker).toHaveBeenCalledOnce()
  })

  it('leaves the picker closed when the value is false', () => {
    // arrange
    input.showPicker = showPicker

    // act
    vShowPickerOnMount.mounted(input, { value: false })

    // assert
    expect(showPicker).not.toHaveBeenCalled()
  })
})
