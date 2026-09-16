import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/vue'
import { flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@/shared/api'
import LoginPage from '../login-page.vue'

const user = userEvent.setup()

describe('login-page', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders the login form', () => {
    // arrange
    // act
    render(LoginPage)

    // assert
    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Username')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
  })

  it('disables sign in until both fields are filled', async () => {
    // arrange
    render(LoginPage)
    const signIn = screen.getByRole('button', { name: 'Sign In' })

    // assert
    expect(signIn).toBeDisabled()

    // act
    await user.type(screen.getByPlaceholderText('Username'), 'john')

    // assert
    expect(signIn).toBeDisabled()

    // act
    await user.type(screen.getByPlaceholderText('Password'), 'secret')

    // assert
    expect(signIn).toBeEnabled()
  })

  it('signs in with the entered credentials', async () => {
    // arrange
    const mockUser = { id: '1', username: 'john', role: 'user' }
    vi.spyOn(api.auth, 'login').mockResolvedValue(mockUser)
    render(LoginPage)
    await user.type(screen.getByPlaceholderText('Username'), 'john')
    await user.type(screen.getByPlaceholderText('Password'), 'secret')

    // act
    await user.click(screen.getByRole('button', { name: 'Sign In' }))
    await flushPromises()

    // assert
    expect(api.auth.login).toHaveBeenCalledExactlyOnceWith('john', 'secret')
  })

  it('does not sign in when fields are empty', async () => {
    // arrange
    const loginSpy = vi.spyOn(api.auth, 'login')
    render(LoginPage)

    // act
    await user.click(screen.getByRole('button', { name: 'Sign In' }))
    await flushPromises()

    // assert
    expect(loginSpy).not.toHaveBeenCalled()
  })

  it('shows an error message when login fails', async () => {
    // arrange
    vi.spyOn(api.auth, 'login').mockRejectedValue(new Error('Invalid credentials'))
    render(LoginPage)
    await user.type(screen.getByPlaceholderText('Username'), 'john')
    await user.type(screen.getByPlaceholderText('Password'), 'wrong')

    // act
    await user.click(screen.getByRole('button', { name: 'Sign In' }))

    // assert
    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Username')).toHaveClass('error')
    expect(screen.getByPlaceholderText('Password')).toHaveClass('error')
  })
})
