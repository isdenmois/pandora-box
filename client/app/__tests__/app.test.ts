import { render } from '@testing-library/vue'
import { flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { auth, useAuth, useUsers } from '@/shared/lib'
import App from '../app.vue'

const renderApp = () =>
  render(App, {
    global: {
      stubs: {
        RouterView: true,
        Navbar: true,
        LoginPage: true,
        ConfirmDialog: true,
      },
    },
  })

describe('app', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.spyOn(auth, 'init').mockResolvedValue()
  })

  it('initializes auth on mount and clears the directory while logged out', async () => {
    // arrange
    const users = useUsers()
    const clear = vi.spyOn(users, 'clear')
    const refresh = vi.spyOn(users, 'refresh')

    // act
    renderApp()
    await flushPromises()

    // assert
    expect(auth.init).toHaveBeenCalledOnce()
    expect(clear).toHaveBeenCalledOnce()
    expect(refresh).not.toHaveBeenCalled()
  })

  it('refreshes the directory when a user logs in', async () => {
    // arrange
    const users = useUsers()
    const refresh = vi.spyOn(users, 'refresh').mockResolvedValue()

    renderApp()
    await flushPromises()

    // act
    useAuth().setUser({ id: 'u1', username: 'me', role: 'user' })
    await flushPromises()

    // assert
    expect(refresh).toHaveBeenCalledOnce()
  })

  it('clears the directory when the user logs out', async () => {
    // arrange
    const users = useUsers()
    vi.spyOn(users, 'refresh').mockResolvedValue()
    const clear = vi.spyOn(users, 'clear')

    useAuth().setUser({ id: 'u1', username: 'me', role: 'user' })
    renderApp()
    await flushPromises()

    // act
    useAuth().setUser(null)
    await flushPromises()

    // assert
    expect(clear).toHaveBeenCalledOnce()
  })
})
