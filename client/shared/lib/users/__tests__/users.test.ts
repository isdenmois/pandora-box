import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api, type UserSummary } from '@/shared/api'
import { useUsers } from '../users'

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

describe('useUsers store', () => {
  it('refresh loads the directory and toggles loading', async () => {
    // arrange
    const directory: UserSummary[] = [
      { id: 'user-1', username: 'me' },
      { id: 'user-2', username: 'other' },
    ]
    let resolve!: (users: UserSummary[]) => void
    const pending = new Promise<UserSummary[]>((done) => {
      resolve = done
    })
    vi.spyOn(api.user, 'list').mockReturnValue(pending)

    const store = useUsers()

    // act
    const refreshing = store.refresh()

    // assert
    expect(store.isLoading).toBe(true)

    // act
    resolve(directory)
    await refreshing

    // assert
    expect(store.isLoading).toBe(false)
    expect(store.all).toEqual(directory)
    expect(api.user.list).toHaveBeenCalledOnce()
  })

  it('a failed refresh empties the directory and stops loading', async () => {
    // arrange
    const store = useUsers()
    store.all = [{ id: 'stale', username: 'stale' }]
    vi.spyOn(api.user, 'list').mockRejectedValue(new Error('network down'))

    // act
    await store.refresh()

    // assert
    expect(store.all).toEqual([])
    expect(store.isLoading).toBe(false)
  })

  it('byId returns a known user and undefined otherwise', () => {
    // arrange
    const store = useUsers()
    store.all = [{ id: 'user-1', username: 'me' }]

    // act
    const known = store.byId('user-1')
    const missing = store.byId('user-2')

    // assert
    expect(known).toEqual({ id: 'user-1', username: 'me' })
    expect(missing).toBeUndefined()
  })

  it('nameFor resolves null, a known user and an unresolved id', () => {
    // arrange
    const store = useUsers()
    store.all = [{ id: 'user-1', username: 'me' }]

    // act
    const nullish = store.nameFor(null)
    const known = store.nameFor('user-1')
    const unknown = store.nameFor('user-2')

    // assert
    expect(nullish).toBeNull()
    expect(known).toBe('me')
    expect(unknown).toBe('Unknown')
  })

  it('clear empties the directory', () => {
    // arrange
    const store = useUsers()
    store.all = [{ id: 'user-1', username: 'me' }]

    // act
    store.clear()

    // assert
    expect(store.all).toEqual([])
  })
})
