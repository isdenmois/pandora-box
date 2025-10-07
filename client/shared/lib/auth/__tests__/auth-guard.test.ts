import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import type { User } from '@/shared/api'
import { authGuard } from '../auth-guard'
import { useAuth } from '../auth-state'

describe('authGuard', () => {
  let store: ReturnType<typeof useAuth>

  beforeAll(() => {
    setActivePinia(createPinia())
  })

  beforeEach(() => {
    store = useAuth()
  })

  it('returns true when the user has the admin role', () => {
    // arrange
    vi.spyOn(store, 'user', 'get').mockReturnValue({ role: 'admin' } as User)

    // act
    const result = authGuard()

    // assert
    expect(result).toBe(true)
  })

  it('returns false when the user does not have the admin role', () => {
    // arrange
    vi.spyOn(store, 'user', 'get').mockReturnValue({ role: 'user' } as User)

    // act
    const result = authGuard()

    // assert
    expect(result).toBe(false)
  })

  it('returns false when there is no user', () => {
    // arrange
    vi.spyOn(store, 'user', 'get').mockReturnValue(null)

    // act
    const result = authGuard()

    // assert
    expect(result).toBe(false)
  })
})
