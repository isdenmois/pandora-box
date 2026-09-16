import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Dialog from '../dialog.vue'

const router = vi.hoisted(() => ({
  back: vi.fn(),
  replace: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRouter: () => router,
}))

const user = userEvent.setup()

describe('dialog', () => {
  beforeEach(() => {
    router.back.mockClear()
    router.replace.mockClear()
    history.replaceState({}, '')
  })

  it('renders the teleported dialog with slot content', () => {
    // arrange
    // act
    render(Dialog, { props: { id: 'test' }, slots: { default: '<p>dialog content</p>' } })

    // assert
    expect(screen.getByTestId('dialog-test')).toBeInTheDocument()
    expect(screen.getByText('dialog content')).toBeInTheDocument()
  })

  it('goes back in history when the backdrop is clicked with history state', async () => {
    // arrange
    const onGoBack = vi.fn()
    history.replaceState({ back: '/home' }, '')
    render(Dialog, { props: { id: 'test', onGoBack } })

    // act
    await user.click(document.querySelector('.backdrop')!)

    // assert
    expect(router.back).toHaveBeenCalledExactlyOnceWith()
    expect(router.replace).not.toHaveBeenCalled()
    expect(onGoBack).toHaveBeenCalledExactlyOnceWith()
  })

  it('replaces with the parent route when there is no history state', async () => {
    // arrange
    const onGoBack = vi.fn()
    render(Dialog, { props: { id: 'test', parent: '/movies', onGoBack } })

    // act
    await user.click(document.querySelector('.backdrop')!)

    // assert
    expect(router.replace).toHaveBeenCalledExactlyOnceWith('/movies')
    expect(router.back).not.toHaveBeenCalled()
    expect(onGoBack).toHaveBeenCalledExactlyOnceWith()
  })
})
