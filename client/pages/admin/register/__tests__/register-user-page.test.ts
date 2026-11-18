import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/vue'
import { flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@/shared/api'
import RegisterUserPage from '../ui/register-user-page.vue'

const user = userEvent.setup()

const fillForm = async (username: string, password: string) => {
  await user.type(screen.getByPlaceholderText('Username'), username)
  await user.type(screen.getByPlaceholderText('Password'), password)
}

describe('register-user-page', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.spyOn(api.admin, 'register').mockResolvedValue({})
  })

  it('registers the entered user and clears the form', async () => {
    // arrange
    render(RegisterUserPage)
    await fillForm('john', 'secret')

    // act
    await user.click(screen.getByRole('button', { name: 'Register' }))
    await flushPromises()

    // assert
    expect(api.admin.register).toHaveBeenCalledExactlyOnceWith('john', 'secret')
    expect(screen.getByPlaceholderText('Username')).toHaveValue('')
    expect(screen.getByPlaceholderText('Password')).toHaveValue('')
  })

  it('shows the failure message and keeps the entered values', async () => {
    // arrange
    vi.spyOn(api.admin, 'register').mockRejectedValue(new Error('Name already taken'))
    render(RegisterUserPage)
    await fillForm('john', 'secret')

    // act
    await user.click(screen.getByRole('button', { name: 'Register' }))

    // assert
    expect(await screen.findByText('Name already taken')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Username')).toHaveValue('john')
    expect(screen.getByPlaceholderText('Password')).toHaveValue('secret')
  })
})
