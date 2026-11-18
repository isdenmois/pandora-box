import userEvent from '@testing-library/user-event'
import { fireEvent, render, screen } from '@testing-library/vue'
import { flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useUsers } from '@/shared/lib'
import { confrimData } from '../confirm/use-confirm'
import EditForm from '../edit-form.vue'
import { makeMovie } from './fixtures'

const user = userEvent.setup()

describe('edit-form', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    confrimData.value = null
    // jsdom has no blob URLs; the preview only needs a stable value.
    URL.createObjectURL = vi.fn(() => 'blob:poster-preview')
    URL.revokeObjectURL = vi.fn()
  })

  it('renders the initial field values from the data', () => {
    // arrange
    // act
    render(EditForm, { props: { data: makeMovie(), tags: [] } })

    // assert
    expect(screen.getByPlaceholderText('Title')).toHaveValue('Some Movie')
    expect(screen.getByPlaceholderText('Reason')).toHaveValue('because')
    expect(screen.getByPlaceholderText('Poster URL')).toHaveValue('https://example.com/poster.jpg')
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
    expect(onSave).toHaveBeenCalledExactlyOnceWith(
      {
        title: 'New Title',
        season: 0,
        reason: 'because',
        recommendedBy: null,
        private: false,
        scheduled: null,
        tags: ['old'],
        poster: 'https://example.com/poster.jpg',
      },
      null,
    )
  })

  it('emits the picked file and leaves the URL out of the payload', async () => {
    // arrange
    const onSave = vi.fn()
    render(EditForm, { props: { data: makeMovie(), tags: [], onSave } })
    const file = new File([new Uint8Array([1, 2, 3])], 'poster.png', { type: 'image/png' })

    // act
    await user.click(screen.getByRole('button', { name: 'Upload' }))
    await user.upload(screen.getByLabelText('Poster file'), file)
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await flushPromises()

    // assert
    // A file owns its own bytes; sending the URL alongside would make the server guess again.
    expect(onSave).toHaveBeenCalledExactlyOnceWith(
      {
        title: 'Some Movie',
        season: 0,
        reason: 'because',
        recommendedBy: null,
        private: false,
        scheduled: null,
        tags: [],
      },
      file,
    )
  })

  it('sends the selected recommender', async () => {
    // arrange
    useUsers().all = [
      { id: 'user-1', username: 'me' },
      { id: 'user-2', username: 'other' },
    ]
    const onSave = vi.fn()
    render(EditForm, { props: { data: makeMovie(), tags: [], onSave } })

    // act
    await user.click(screen.getByText('other'))
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await flushPromises()

    // assert
    expect(onSave).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ recommendedBy: 'user-2' }), null)
  })

  it('shows the picked file in the preview', async () => {
    // arrange
    render(EditForm, { props: { data: makeMovie(), tags: [] } })
    const file = new File([new Uint8Array([1, 2, 3])], 'poster.png', { type: 'image/png' })

    // act
    await user.click(screen.getByRole('button', { name: 'Upload' }))
    await user.upload(screen.getByLabelText('Poster file'), file)

    // assert
    expect(URL.createObjectURL).toHaveBeenCalledWith(file)
  })

  it('goes back to the URL tab and drops the picked file', async () => {
    // arrange
    const onSave = vi.fn()
    render(EditForm, { props: { data: makeMovie(), tags: [], onSave } })
    const file = new File([new Uint8Array([1, 2, 3])], 'poster.png', { type: 'image/png' })

    // act
    await user.click(screen.getByRole('button', { name: 'Upload' }))
    await user.upload(screen.getByLabelText('Poster file'), file)
    await user.click(screen.getByRole('button', { name: 'Use URL instead' }))
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await flushPromises()

    // assert
    expect(screen.getByPlaceholderText('Poster URL')).toHaveValue('https://example.com/poster.jpg')
    expect(onSave).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ poster: 'https://example.com/poster.jpg' }),
      null,
    )
  })

  it('refuses a file whose type the server cannot store', async () => {
    // arrange
    render(EditForm, { props: { data: makeMovie(), tags: [] } })

    // act
    // `user.upload` honours `accept`; this path stands in for a browser or drop that does not.
    await user.click(screen.getByRole('button', { name: 'Upload' }))
    fireEvent.change(screen.getByLabelText('Poster file'), {
      target: { files: [new File(['plain text'], 'poster.txt', { type: 'text/plain' })] },
    })

    // assert
    expect(await screen.findByText('Choose a JPEG, PNG, WebP, GIF or AVIF image')).toBeInTheDocument()
  })

  it('refuses a poster URL that is not http(s)', async () => {
    // arrange
    const onSave = vi.fn()
    render(EditForm, { props: { data: makeMovie({ posterSource: null }), tags: [], onSave } })

    // act
    await user.type(screen.getByPlaceholderText('Poster URL'), 'ftp://example.com/poster.png')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    // assert
    expect(await screen.findByText('Enter an http(s) URL or pick a file')).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()
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
