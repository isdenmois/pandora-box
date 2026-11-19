import type { UserAppType } from '@server/views/http/app-type'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from '../../lib/auth/auth-state'
import { createClient } from '../client'

const mockFetchStatus = (status: number, body = JSON.stringify({ message: 'unauthorized' })) => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(body, { status })))
}

describe('client auth hook', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    useAuth().setUser({ id: 'u1', username: 'me', role: 'user' })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('clears the auth user when the API answers 401', async () => {
    // arrange
    mockFetchStatus(401)

    // act
    await createClient<UserAppType>('/api/v1/user').current.$get()

    // assert
    expect(useAuth().user).toBeNull()
  })

  it('clears the auth user when the API answers 403', async () => {
    // arrange
    mockFetchStatus(403)

    // act
    await createClient<UserAppType>('/api/v1/user').current.$get()

    // assert
    expect(useAuth().user).toBeNull()
  })

  it('clears the auth user when a 401 body is not JSON', async () => {
    // arrange
    mockFetchStatus(401, 'unauthorized')

    // act
    await createClient<UserAppType>('/api/v1/user').current.$get()

    // assert
    expect(useAuth().user).toBeNull()
  })

  it('keeps the auth user when the API fails with another status', async () => {
    // arrange
    mockFetchStatus(500)

    // act
    await createClient<UserAppType>('/api/v1/user').current.$get()

    // assert
    expect(useAuth().user).toEqual({ id: 'u1', username: 'me', role: 'user' })
  })
})
