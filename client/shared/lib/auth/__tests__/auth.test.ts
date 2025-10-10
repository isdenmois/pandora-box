import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import { api } from '../../../api'
import { auth } from '../../auth'
import { useAuth } from '../auth-state'

describe('auth', () => {
  let authStore: ReturnType<typeof useAuth>

  beforeAll(() => {
    setActivePinia(createPinia())
  })

  beforeEach(() => {
    vi.clearAllMocks()
    authStore = useAuth()

    vi.spyOn(authStore, 'setUser')
  })

  it('init fetches current user and sets it', async () => {
    // arrange
    const mockUser = { username: 'testuser', role: 'admin' }
    vi.spyOn(api.user, 'current').mockResolvedValue(mockUser)

    // act
    await auth.init()

    // assert
    expect(authStore.setUser).toHaveBeenCalledExactlyOnceWith(mockUser)
  })

  it('init sets user to null when api.user.current rejects', async () => {
    // arrange
    vi.spyOn(api.user, 'current').mockRejectedValue(new Error('Not found'))

    // act
    await auth.init()

    // assert
    expect(authStore.setUser).toHaveBeenCalledExactlyOnceWith(null)
  })

  it('login calls api.auth.login and sets user', async () => {
    // arrange
    const username = 'john'
    const password = 'secret'
    const mockUser = { username: 'john', role: 'user' }
    vi.spyOn(api.auth, 'login').mockResolvedValue(mockUser)

    // act
    await auth.login(username, password)

    // assert
    expect(api.auth.login).toHaveBeenCalledExactlyOnceWith(username, password)
    expect(authStore.setUser).toHaveBeenCalledExactlyOnceWith(mockUser)
  })

  it('logout clears user and calls api.auth.logout', () => {
    // arrange
    const logoutSpy = vi.spyOn(api.auth, 'logout').mockResolvedValue('')

    // act
    auth.logout()

    // assert
    expect(authStore.setUser).toHaveBeenCalledExactlyOnceWith(null)
    expect(logoutSpy).toHaveBeenCalled()
  })
})
