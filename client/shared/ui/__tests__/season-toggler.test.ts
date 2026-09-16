import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'
import SeasonToggler from '../season-toggler.vue'

const user = userEvent.setup()

describe('season-toggler', () => {
  it('renders the current season value', () => {
    // arrange
    // act
    render(SeasonToggler, { props: { modelValue: 2 } })

    // assert
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('renders the total when it is greater than zero', () => {
    // arrange
    // act
    render(SeasonToggler, { props: { modelValue: 2, total: 8 } })

    // assert
    expect(screen.getByText('of 8')).toBeInTheDocument()
  })

  it('does not render the total when it is zero', () => {
    // arrange
    // act
    render(SeasonToggler, { props: { modelValue: 2, total: 0 } })

    // assert
    expect(screen.queryByText(/of \d+/)).not.toBeInTheDocument()
  })

  it('emits modelValue incremented by one when plus is clicked', async () => {
    // arrange
    const onUpdate = vi.fn()
    render(SeasonToggler, { props: { modelValue: 2, 'onUpdate:modelValue': onUpdate } })

    // act
    await user.click(screen.getByTestId('season-plus'))

    // assert
    expect(onUpdate).toHaveBeenCalledExactlyOnceWith(3)
  })

  it('emits modelValue decremented by one when minus is clicked', async () => {
    // arrange
    const onUpdate = vi.fn()
    render(SeasonToggler, { props: { modelValue: 3, 'onUpdate:modelValue': onUpdate } })

    // act
    await user.click(screen.getByTestId('season-minus'))

    // assert
    expect(onUpdate).toHaveBeenCalledExactlyOnceWith(2)
  })

  it('disables minus when the season is at the first season', () => {
    // arrange
    // act
    render(SeasonToggler, { props: { modelValue: 1 } })

    // assert
    expect(screen.getByTestId('season-minus')).toBeDisabled()
    expect(screen.getByTestId('season-plus')).toBeEnabled()
  })

  it('disables both buttons when disabled prop is set', () => {
    // arrange
    // act
    render(SeasonToggler, { props: { modelValue: 3, disabled: true } })

    // assert
    expect(screen.getByTestId('season-minus')).toBeDisabled()
    expect(screen.getByTestId('season-plus')).toBeDisabled()
  })
})
