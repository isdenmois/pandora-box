import userEvent from '@testing-library/user-event'
import { fireEvent, render, screen } from '@testing-library/vue'
import { flushPromises } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { dateToString } from '../../lib'
import MarkAsViewed from '../mark-as-viewed.vue'
import { makeMovie } from './fixtures'

const user = userEvent.setup()

describe('mark-as-viewed', () => {
  it('defaults the date to today and the rating to zero', () => {
    // arrange
    // act
    render(MarkAsViewed, { props: { data: makeMovie() } })

    // assert
    expect(screen.getByDisplayValue(dateToString(new Date()))).toBeInTheDocument()
    expect(screen.getByText('Rating 0/10')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Comment')).toHaveValue('')
  })

  it('defaults the fields to the existing seen data', () => {
    // arrange
    // act
    render(MarkAsViewed, {
      props: { data: makeMovie({ seen: '2024-01-15', seenRating: 7, seenComment: 'nice' }) },
    })

    // assert
    expect(screen.getByDisplayValue('2024-01-15')).toBeInTheDocument()
    expect(screen.getByText('Rating 7/10')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Comment')).toHaveValue('nice')
  })

  it('updates the rating when a star is clicked', async () => {
    // arrange
    const { container } = render(MarkAsViewed, { props: { data: makeMovie() } })

    // act
    await user.click(container.querySelectorAll('.star')[2])

    // assert
    expect(screen.getByText('Rating 3/10')).toBeInTheDocument()
  })

  it('emits save with the entered data on submit', async () => {
    // arrange
    const onSave = vi.fn()
    const { container } = render(MarkAsViewed, {
      props: { data: makeMovie({ seenRating: 5 }), onSave },
    })

    // act
    await user.type(screen.getByPlaceholderText('Comment'), 'great!')
    fireEvent.submit(container.querySelector('form')!)
    await flushPromises()

    // assert
    expect(onSave).toHaveBeenCalledExactlyOnceWith({
      date: dateToString(new Date()),
      rating: 5,
      comment: 'great!',
    })
  })
})
