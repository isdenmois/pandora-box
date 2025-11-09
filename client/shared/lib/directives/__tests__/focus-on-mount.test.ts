import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { vFocusOnMount } from '../focus-on-mount'

describe('vFocusOnMount', () => {
  let el: HTMLElement

  beforeEach(() => {
    el = document.createElement('input')
    document.body.appendChild(el)
  })

  afterEach(() => {
    document.body.removeChild(el)
  })

  it('should focus on the element when mounted', () => {
    // arrange
    vi.spyOn(el, 'focus')

    // act
    vFocusOnMount.mounted(el)

    // assert
    expect(el.focus).toHaveBeenCalled()
  })
})
