import { createPinia, setActivePinia } from 'pinia'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
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

describe('useMovies poster sync', () => {
  it('takes the stored poster path from the patch response', async () => {
    // arrange
    const revised = {
      id: '1',
      title: 'Test Movie',
      poster: '/images/1.png',
      posterSource: 'https://cdn/poster.png',
    } as Movie

    useMovies().all = [{ id: '1', title: 'Test Movie', poster: 'https://cdn/poster.png' } as Movie]
    vi.spyOn(api.movie, 'patch').mockResolvedValue(revised)

    // act
    await useMovies().update('1', { title: 'Test Movie' })

    // assert
    expect(useMovies().all[0]?.poster).toBe('/images/1.png')
    expect(useMovies().all[0]?.posterSource).toBe('https://cdn/poster.png')
  })

  it('sends a picked file through the multipart save', async () => {
    // arrange
    const revised = {
      id: '1',
      title: 'Test Movie',
      poster: '/images/1.png',
      posterSource: null,
    } as Movie
    const file = new File([new Uint8Array([1])], 'poster.png', { type: 'image/png' })

    useMovies().all = [{ id: '1', title: 'Test Movie', poster: '/images/1.jpg' } as Movie]
    const savePoster = vi.spyOn(api.movie, 'savePoster').mockResolvedValue(revised)

    // act
    await useMovies().update('1', { title: 'Test Movie' }, file)

    // assert
    expect(savePoster).toHaveBeenCalledWith('1', { title: 'Test Movie' }, file)
    expect(useMovies().all[0]?.poster).toBe('/images/1.png')
    // A manual poster has no source to download from again.
    expect(useMovies().all[0]?.posterSource).toBeNull()
  })

  it('asks the server to drop the file and keeps the path it renders', async () => {
    // arrange
    const revised = {
      id: '1',
      title: 'Test Movie',
      poster: '/images/1.jpg',
      posterSource: 'https://cdn/poster.jpg',
    } as Movie

    useMovies().all = [{ id: '1', title: 'Test Movie', poster: '/images/1.jpg' } as Movie]
    vi.spyOn(api.poster, 'redownload').mockResolvedValue(revised)

    // act
    await useMovies().redownloadPoster('1')

    // assert
    // The URL stays the same: the server only dropped the bytes behind it.
    expect(useMovies().all[0]?.poster).toBe('/images/1.jpg')
    expect(useMovies().all[0]?.posterSource).toBe('https://cdn/poster.jpg')
    expect(api.poster.redownload).toHaveBeenCalledWith('1')
  })
})
