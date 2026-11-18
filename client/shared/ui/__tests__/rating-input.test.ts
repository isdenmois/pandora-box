import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'
import RatingInput from '../rating-input.vue'

const user = userEvent.setup()

const star = (value: number) => screen.getByRole('button', { name: `Rate ${value} out of 10` })

const expectOnlyFirstPressed = (value: number) => {
  for (let starValue = 1; starValue <= 10; starValue++) {
    const pressed = starValue <= value

    if (pressed) {
      expect(star(starValue)).toBePressed()
    } else {
      expect(star(starValue)).not.toBePressed()
    }
  }
}

describe('rating-input', () => {
  it('renders ten stars', () => {
    // arrange
    // act
    render(RatingInput, { props: { modelValue: 0 } })

    // assert
    expect(screen.getAllByRole('button')).toHaveLength(10)
  })

  it('marks the stars up to modelValue as pressed', () => {
    // arrange
    // act
    render(RatingInput, { props: { modelValue: 3 } })

    // assert
    expectOnlyFirstPressed(3)
  })

  it('does not mark any star as pressed without a model value', () => {
    // arrange
    // act
    render(RatingInput, { props: {} })

    // assert
    expectOnlyFirstPressed(0)
  })

  it('emits the clicked star number as model value', async () => {
    // arrange
    const onUpdate = vi.fn()
    render(RatingInput, { props: { modelValue: 0, 'onUpdate:modelValue': onUpdate } })

    // act
    await user.click(star(4))

    // assert
    expect(onUpdate).toHaveBeenCalledExactlyOnceWith(4)
  })

  it('emits a lower value when the user picks a smaller rating', async () => {
    // arrange
    const onUpdate = vi.fn()
    render(RatingInput, { props: { modelValue: 7, 'onUpdate:modelValue': onUpdate } })

    // act
    await user.click(star(2))

    // assert
    expect(onUpdate).toHaveBeenCalledExactlyOnceWith(2)
  })
})
