import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api, type Movie, type MovieCreate, type MovieUpdate, type MovieView } from '@/shared/api'
import { makeMovie } from '@/shared/ui/__tests__/fixtures'
import { useMovies } from '../movies'

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

describe('useMovies store', () => {
  it('refresh loads movies and toggles loading', async () => {
    // arrange
    const row = makeMovie()
    let resolve!: (movies: Movie[]) => void
    const pending = new Promise<Movie[]>((done) => {
      resolve = done
    })
    vi.spyOn(api.movie, 'getAll').mockReturnValue(pending)

    const store = useMovies()

    // act
    const refreshing = store.refresh()

    // assert
    expect(store.isLoading).toBe(true)

    // act
    resolve([row])
    await refreshing

    // assert
    expect(store.isLoading).toBe(false)
    expect(store.all).toEqual([row])
    expect(api.movie.getAll).toHaveBeenCalledOnce()
  })

  it('refresh stops loading and rejects when the request fails', async () => {
    // arrange
    vi.spyOn(api.movie, 'getAll').mockRejectedValue(new Error('boom'))
    const store = useMovies()

    // act
    const refreshing = store.refresh()

    // assert
    await expect(refreshing).rejects.toThrow('boom')
    expect(store.isLoading).toBe(false)
  })

  it('create appends the returned movie', async () => {
    // arrange
    const existing = makeMovie({ id: 'movie-0', title: 'Existing' })
    const created = makeMovie({ id: 'movie-2', title: 'New Movie' })
    vi.spyOn(api.movie, 'create').mockResolvedValue(created)

    const store = useMovies()
    store.all = [existing]

    // act
    await store.create({ title: 'New Movie' } as MovieCreate)

    // assert
    expect(store.all).toEqual([existing, created])
    expect(api.movie.create).toHaveBeenCalledExactlyOnceWith({ title: 'New Movie' })
  })

  it('byId returns a cached row without calling the API', async () => {
    // arrange
    const row = makeMovie()
    const byId = vi.spyOn(api.movie, 'byId')

    const store = useMovies()
    store.all = [row]

    // act
    const result = await store.byId('movie-1')

    // assert
    expect(result).toEqual(row)
    expect(byId).not.toHaveBeenCalled()
  })

  it('byId fetches once and caches the row when it is absent', async () => {
    // arrange
    const fetched = makeMovie({ id: 'movie-2', title: 'Fetched' })
    const byId = vi.spyOn(api.movie, 'byId').mockResolvedValue(fetched)

    const store = useMovies()

    // act
    const first = await store.byId('movie-2')
    const second = await store.byId('movie-2')

    // assert
    expect(first).toEqual(fetched)
    expect(second).toEqual(fetched)
    expect(byId).toHaveBeenCalledExactlyOnceWith('movie-2')
    expect(store.all).toEqual([fetched])
  })

  it('delete removes the row and calls the API', async () => {
    // arrange
    const kept = makeMovie({ id: 'movie-0', title: 'Kept' })
    const removed = makeMovie({ id: 'movie-2', title: 'Removed' })
    vi.spyOn(api.movie, 'delete').mockResolvedValue('')

    const store = useMovies()
    store.all = [kept, removed]

    // act
    await store.delete('movie-2')

    // assert
    expect(store.all).toEqual([kept])
    expect(api.movie.delete).toHaveBeenCalledExactlyOnceWith('movie-2')
  })

  it('update sends a picked file through the multipart save and takes the server poster', async () => {
    // arrange
    const existed = makeMovie({ poster: '/images/movie-1.jpg', posterSource: 'https://cdn/old.jpg' })
    const revised = makeMovie({ poster: '/images/movie-1.png', posterSource: null })
    const file = new File([new Uint8Array([1])], 'poster.png', { type: 'image/png' })

    const savePoster = vi.spyOn(api.movie, 'savePoster').mockResolvedValue(revised)
    const patch = vi.spyOn(api.movie, 'patch')

    const store = useMovies()
    store.all = [existed]

    // act
    await store.update('movie-1', { title: 'Some Movie' } as MovieUpdate, file)

    // assert
    expect(savePoster).toHaveBeenCalledExactlyOnceWith('movie-1', { title: 'Some Movie' }, file)
    expect(patch).not.toHaveBeenCalled()
    expect(store.all[0]?.poster).toBe('/images/movie-1.png')
    // A manual poster has no source to download from again.
    expect(store.all[0]?.posterSource).toBeNull()
  })

  it('update without a file patches the row and takes the server poster', async () => {
    // arrange
    const existed = makeMovie({ poster: '/images/movie-1.jpg', posterSource: 'https://cdn/old.jpg' })
    const revised = makeMovie({ poster: '/images/movie-1.png', posterSource: 'https://cdn/new.jpg' })

    const patch = vi.spyOn(api.movie, 'patch').mockResolvedValue(revised)
    const savePoster = vi.spyOn(api.movie, 'savePoster')

    const store = useMovies()
    store.all = [existed]

    // act
    await store.update('movie-1', { title: 'Some Movie' } as MovieUpdate)

    // assert
    expect(patch).toHaveBeenCalledExactlyOnceWith('movie-1', { title: 'Some Movie' })
    expect(savePoster).not.toHaveBeenCalled()
    expect(store.all[0]?.poster).toBe('/images/movie-1.png')
    expect(store.all[0]?.posterSource).toBe('https://cdn/new.jpg')
  })

  it('redownloadPoster merges the server response and keeps the rendered path', async () => {
    // arrange
    const existed = makeMovie({ poster: '/images/movie-1.jpg', posterSource: null })
    const revised = makeMovie({ poster: '/images/movie-1.jpg', posterSource: 'https://cdn/poster.jpg' })
    vi.spyOn(api.poster, 'redownload').mockResolvedValue(revised)

    const store = useMovies()
    store.all = [existed]

    // act
    await store.redownloadPoster('movie-1')

    // assert
    expect(api.poster.redownload).toHaveBeenCalledExactlyOnceWith('movie-1')
    // The URL stays the same: the server only dropped the bytes behind it.
    expect(store.all[0]?.poster).toBe('/images/movie-1.jpg')
    expect(store.all[0]?.posterSource).toBe('https://cdn/poster.jpg')
  })

  it('markAsViewed sets the view optimistically before the request resolves', async () => {
    // arrange
    let resolve!: (view: MovieView) => void
    const pending = new Promise<MovieView>((done) => {
      resolve = done
    })
    const markAsViewed = vi.spyOn(api.movie, 'markAsViewed').mockReturnValue(pending)

    const store = useMovies()
    store.all = [makeMovie()]

    // act
    const saving = store.markAsViewed('movie-1', '2024-05-06', 8, 'Great')

    // assert
    expect(store.all[0]?.seen).toBe('2024-05-06')
    expect(store.all[0]?.seenRating).toBe(8)
    expect(store.all[0]?.seenComment).toBe('Great')

    // act
    resolve({} as MovieView)
    await saving

    // assert
    expect(markAsViewed).toHaveBeenCalledExactlyOnceWith('movie-1', '2024-05-06', 8, 'Great')
  })

  it('removeMovieView clears seen optimistically before the request resolves', async () => {
    // arrange
    let resolve!: (value: string) => void
    const pending = new Promise<string>((done) => {
      resolve = done
    })
    const removeMovieView = vi.spyOn(api.movie, 'removeMovieView').mockReturnValue(pending)

    const store = useMovies()
    store.all = [makeMovie({ seen: '2024-05-06', seenRating: 8, seenComment: 'Great' })]

    // act
    const removing = store.removeMovieView('movie-1')

    // assert
    expect(store.all[0]?.seen).toBeNull()

    // act
    resolve('')
    await removing

    // assert
    expect(removeMovieView).toHaveBeenCalledExactlyOnceWith('movie-1')
  })
})

describe('useMovies refreshData', () => {
  it('does nothing for a row that did not come from omdb', async () => {
    // arrange
    const search = vi.spyOn(api.search, 'byId')
    const patch = vi.spyOn(api.movie, 'patch')

    const store = useMovies()
    store.all = [makeMovie({ provider: 'manual' })]

    // act
    await store.refreshData('movie-1')

    // assert
    expect(search).not.toHaveBeenCalled()
    expect(patch).not.toHaveBeenCalled()
  })

  it('does nothing for a row without an external id', async () => {
    // arrange
    const search = vi.spyOn(api.search, 'byId')
    const patch = vi.spyOn(api.movie, 'patch')

    const store = useMovies()
    store.all = [makeMovie({ extId: null })]

    // act
    await store.refreshData('movie-1')

    // assert
    expect(search).not.toHaveBeenCalled()
    expect(patch).not.toHaveBeenCalled()
  })

  it('merges the omdb details, keeps N/A values out and merges the patched row', async () => {
    // arrange
    const existed = makeMovie({
      title: 'Old Title',
      rating: 5,
      year: 2019,
      genre: 'Comedy',
      poster: '/images/movie-1.jpg',
      posterSource: 'https://cdn/old.jpg',
      extra: { Actors: 'Old Actor' },
    })
    vi.spyOn(api.search, 'byId').mockResolvedValue({
      id: 'tt123',
      provider: 'omdb',
      title: 'New Title',
      type: 'movie',
      year: 2020,
      poster: 'https://cdn/new.jpg',
      rating: 8,
      genre: 'Drama',
      language: 'English',
      extra: { Actors: 'New Actor', Runtime: 'N/A' },
    })
    const patch = vi.spyOn(api.movie, 'patch').mockResolvedValue(
      makeMovie({
        title: 'New Title',
        rating: 8,
        year: 2020,
        genre: 'Drama',
        poster: '/images/movie-1.png',
        posterSource: 'https://cdn/new.jpg',
        extra: { Actors: 'New Actor' },
      }),
    )

    const store = useMovies()
    store.all = [existed]

    // act
    await store.refreshData('movie-1')

    // assert
    expect(api.search.byId).toHaveBeenCalledExactlyOnceWith('tt123', 'omdb')
    expect(patch).toHaveBeenCalledExactlyOnceWith('movie-1', {
      title: 'New Title',
      rating: 8,
      year: 2020,
      poster: 'https://cdn/new.jpg',
      genre: 'Drama',
      extra: { Actors: 'New Actor' },
    })
    expect(store.all[0]?.poster).toBe('/images/movie-1.png')
    expect(store.all[0]?.extra).toEqual({ Actors: 'New Actor' })
  })
})
