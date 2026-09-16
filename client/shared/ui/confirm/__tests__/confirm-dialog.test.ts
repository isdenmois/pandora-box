import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ConfirmDialog from '../confrim-dialog.vue'
import { confrimData, useConfirm } from '../use-confirm'

const router = vi.hoisted(() => ({
  back: vi.fn(),
  replace: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRouter: () => router,
}))

const user = userEvent.setup()

describe('confirm-dialog', () => {
  beforeEach(() => {
    router.back.mockClear()
    router.replace.mockClear()
    history.replaceState({}, '')
    confrimData.value = null
  })

  it('renders the teleported title and message of the pending confirm', async () => {
    // arrange
    const confirm = useConfirm()
    const promise = confirm({ title: 'Delete movie', message: 'Do you want to delete "Foo"?' })

    // act
    render(ConfirmDialog)

    // assert
    expect(await screen.findByText('Delete movie')).toBeInTheDocument()
    expect(screen.getByText('Do you want to delete "Foo"?')).toBeInTheDocument()

    confrimData.value?.resolve(false)
    await promise
  })

  it('resolves with true when Yes is clicked', async () => {
    // arrange
    const confirm = useConfirm()
    const promise = confirm({ title: 'Delete movie' })
    render(ConfirmDialog)

    // act
    await user.click(await screen.findByRole('button', { name: 'Yes' }))

    // assert
    await expect(promise).resolves.toBe(true)
    expect(confrimData.value).toBeNull()
  })

  it('resolves with false when No is clicked', async () => {
    // arrange
    const confirm = useConfirm()
    const promise = confirm({ title: 'Delete movie' })
    render(ConfirmDialog)

    // act
    await user.click(await screen.findByRole('button', { name: 'No' }))

    // assert
    await expect(promise).resolves.toBe(false)
  })

  it('resolves with false when the backdrop is clicked', async () => {
    // arrange
    const confirm = useConfirm()
    const promise = confirm({ title: 'Delete movie' })
    render(ConfirmDialog)
    await screen.findByText('Delete movie')

    // act
    await user.click(document.querySelector('.backdrop')!)

    // assert
    await expect(promise).resolves.toBe(false)
  })

  it('marks Yes as danger when the confirm is dangerous', async () => {
    // arrange
    const confirm = useConfirm()
    const promise = confirm({ title: 'Delete movie', danger: true })

    // act
    render(ConfirmDialog)

    // assert
    expect(await screen.findByRole('button', { name: 'Yes' })).toHaveClass('danger')

    confrimData.value?.resolve(false)
    await promise
  })
})
