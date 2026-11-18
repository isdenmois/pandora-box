import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from '../../lib/auth/auth-state'

const mockFetchStatus = (status: number, body = JSON.stringify({ message: 'unauthorized' })) => {
  // The api's customError parses the body as JSON before the catchers run.
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(body, { status })))
}

describe('http auth catchers', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    useAuth().setUser({ id: 'u1', username: 'me', role: 'user' })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('clears the auth user when the API answers 401', async () => {
    // arrange
    const { http } = await import('../http')
    mockFetchStatus(401)

    // act
    await http
      .url('/probe')
      .get()
      .res()
      .catch(() => {})

    // assert
    expect(useAuth().user).toBeNull()
  })

  it('clears the auth user when the API answers 403', async () => {
    // arrange
    const { http } = await import('../http')
    mockFetchStatus(403)

    // act
    await http
      .url('/probe')
      .get()
      .res()
      .catch(() => {})

    // assert
    expect(useAuth().user).toBeNull()
  })

  it('clears the auth user when a 401 body is not JSON', async () => {
    // arrange
    const { http } = await import('../http')
    mockFetchStatus(401, 'unauthorized')

    // act
    await http
      .url('/probe')
      .get()
      .res()
      .catch(() => {})

    // assert
    expect(useAuth().user).toBeNull()
  })

  it('keeps the auth user when the API fails with another status', async () => {
    // arrange
    const { http } = await import('../http')
    mockFetchStatus(500)

    // act
    await http
      .url('/probe')
      .get()
      .res()
      .catch(() => {})

    // assert
    expect(useAuth().user).toEqual({ id: 'u1', username: 'me', role: 'user' })
  })
})
