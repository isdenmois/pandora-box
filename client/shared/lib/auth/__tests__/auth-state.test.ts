import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuth } from '../auth-state'

describe('auth-state store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes with undefined user', () => {
    // act
    const auth = useAuth()

    // assert
    expect(auth.user).toBeUndefined()
    expect(auth.initialized).toBe(false)
    expect(auth.isLoggedIn).toBe(false)
  })

  it('sets user to null correctly', () => {
    // arrange
    const auth = useAuth()

    // act
    auth.setUser(null)

    // assert
    expect(auth.user).toBeNull()
    expect(auth.initialized).toBe(true)
    expect(auth.isLoggedIn).toBe(false)
  })

  it('sets user to a valid object correctly', () => {
    // arrange
    const auth = useAuth()
    const mockUser = { username: 'alice', role: 'user' }

    // act
    auth.setUser(mockUser)

    // assert
    expect(auth.user).toBe(mockUser)
    expect(auth.initialized).toBe(true)
    expect(auth.isLoggedIn).toBe(true)
  })
})
