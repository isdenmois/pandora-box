import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/vue'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { confrimData } from '../confirm/use-confirm'
import EditForm from '../edit-form.vue'
import { makeMovie } from './fixtures'

const user = userEvent.setup()

describe('edit-form', () => {
  beforeEach(() => {
    confrimData.value = null
  })

  it('renders the initial field values from the data', () => {
    // arrange
    // act
    render(EditForm, { props: { data: makeMovie(), tags: [] } })

    // assert
    expect(screen.getByPlaceholderText('Title')).toHaveValue('Some Movie')
    expect(screen.getByPlaceholderText('Reason')).toHaveValue('because')
  })

  it('shows a validation error and does not save when the title is empty', async () => {
    // arrange
    const onSave = vi.fn()
    render(EditForm, { props: { data: makeMovie(), tags: [], onSave } })
    const title = screen.getByPlaceholderText('Title')

    // act
    await user.clear(title)
    await user.click(screen.getByRole('button', { name: 'Save' }))

    // assert
    expect(await screen.findByText('Title is required')).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('emits save with the form payload when the form is valid', async () => {
    // arrange
    const onSave = vi.fn()
    render(EditForm, { props: { data: makeMovie({ tags: ['old'] }), tags: [], onSave } })
    const title = screen.getByPlaceholderText('Title')

    // act
    await user.clear(title)
    await user.type(title, 'New Title')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await flushPromises()

    // assert
    expect(onSave).toHaveBeenCalledExactlyOnceWith({
      title: 'New Title',
      season: 0,
      reason: 'because',
      private: false,
      scheduled: null,
      tags: ['old'],
    })
  })

  it('toggles the list between global and for-me on click', async () => {
    // arrange
    render(EditForm, { props: { data: makeMovie(), tags: [] } })

    // act
    await user.click(screen.getByText('For Me'))

    // assert
    expect(screen.getByText('For Me')).toHaveClass('active')
    expect(screen.getByText('Global')).not.toHaveClass('active')
  })

  it('opens a danger confirm and emits delete when it is accepted', async () => {
    // arrange
    const onDelete = vi.fn()
    render(EditForm, { props: { data: makeMovie(), tags: [], onDelete } })

    // act
    await user.click(screen.getByRole('button', { name: 'Remove' }))

    // assert
    expect(confrimData.value).toMatchObject({
      title: 'Delete movie',
      message: 'Do you want to delete "Some Movie"?',
      danger: true,
    })

    confrimData.value?.resolve(true)
    await flushPromises()
    expect(onDelete).toHaveBeenCalledExactlyOnceWith()
  })

  it('does not emit delete when the confirm is cancelled', async () => {
    // arrange
    const onDelete = vi.fn()
    render(EditForm, { props: { data: makeMovie(), tags: [], onDelete } })

    // act
    await user.click(screen.getByRole('button', { name: 'Remove' }))
    confrimData.value?.resolve(false)
    await flushPromises()

    // assert
    expect(onDelete).not.toHaveBeenCalled()
  })
})
