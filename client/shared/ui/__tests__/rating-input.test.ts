import userEvent from '@testing-library/user-event'
import { render } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'
import RatingInput from '../rating-input.vue'

const user = userEvent.setup()

const getStars = (container: HTMLElement) => Array.from(container.querySelectorAll('.star'))

describe('rating-input', () => {
  it('renders ten stars', () => {
    // arrange
    // act
    const { container } = render(RatingInput, { props: { modelValue: 0 } })

    // assert
    expect(getStars(container)).toHaveLength(10)
  })

  it('marks stars up to modelValue as selected', () => {
    // arrange
    // act
    const { container } = render(RatingInput, { props: { modelValue: 3 } })

    // assert
    const stars = getStars(container)

    for (const star of stars.slice(0, 3)) {
      expect(star).toHaveClass('selected')
    }
    for (const star of stars.slice(3)) {
      expect(star).not.toHaveClass('selected')
    }
  })

  it('does not mark any star as selected without a model value', () => {
    // arrange
    // act
    const { container } = render(RatingInput, { props: {} })

    // assert
    for (const star of getStars(container)) {
      expect(star).not.toHaveClass('selected')
    }
  })

  it('emits the clicked star number as model value', async () => {
    // arrange
    const onUpdate = vi.fn()
    const { container } = render(RatingInput, { props: { modelValue: 0, 'onUpdate:modelValue': onUpdate } })

    // act
    await user.click(getStars(container)[3])

    // assert
    expect(onUpdate).toHaveBeenCalledExactlyOnceWith(4)
  })
})
