import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { api, type Movie } from '@/shared/api'
import { useMovies } from '../movies'

beforeAll(async () => {
  setActivePinia(createPinia())
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useMovies store', () => {
  it('refresh loads movies and toggles loading', async () => {
    // arrange
    const mockMovies = [{ id: '1', title: 'Test Movie' } as Movie]
    vi.spyOn(api.movie, 'getAll').mockResolvedValue(mockMovies)

    const store = useMovies()

    // act
    await store.refresh()

    // assert
    expect(store.isLoading).toBe(false)
    expect(store.all).toEqual(mockMovies)
    expect(api.movie.getAll).toHaveBeenCalled()
  })

  it('create adds movie to list', async () => {
    // arrange
    const initialMovies = [{ id: '1', title: 'Existing' } as Movie]
    const newMovie = { id: '2', title: 'New Movie' } as Movie

    vi.spyOn(api.movie, 'getAll').mockResolvedValue(initialMovies)
    vi.spyOn(api.movie, 'create').mockResolvedValue(newMovie)

    const store = useMovies()
    await store.refresh() // load initial

    // act
    await store.create({ title: 'New Movie' } as Movie)

    // assert
    expect(store.all).toContainEqual(newMovie)
    expect(api.movie.create).toHaveBeenCalledWith({ title: 'New Movie' })
  })
})
