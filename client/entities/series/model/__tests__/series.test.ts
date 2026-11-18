import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  api,
  type SearchItemDetails,
  type Series,
  type SeriesCreate,
  type SeriesUpdate,
  type SeriesView,
} from '@/shared/api'
import { makeSeries } from '@/shared/ui/__tests__/fixtures'
import { useSeries } from '../series'

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useSeries store', () => {
  it('refresh loads series and toggles loading', async () => {
    // arrange
    const row = makeSeries()
    let resolve!: (series: Series[]) => void
    const pending = new Promise<Series[]>((done) => {
      resolve = done
    })
    vi.spyOn(api.series, 'getAll').mockReturnValue(pending)

    const store = useSeries()

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
    expect(api.series.getAll).toHaveBeenCalledOnce()
  })

  it('create appends the returned series', async () => {
    // arrange
    const existing = makeSeries({ id: 'series-0', title: 'Existing' })
    const created = makeSeries({ id: 'series-2', title: 'New Series' })
    vi.spyOn(api.series, 'create').mockResolvedValue(created)

    const store = useSeries()
    store.all = [existing]

    // act
    await store.create({ title: 'New Series' } as unknown as SeriesCreate)

    // assert
    expect(store.all).toEqual([existing, created])
    expect(api.series.create).toHaveBeenCalledExactlyOnceWith({ title: 'New Series' })
  })

  it('byId returns a cached row without calling the API', async () => {
    // arrange
    const row = makeSeries()
    const byId = vi.spyOn(api.series, 'byId')

    const store = useSeries()
    store.all = [row]

    // act
    const result = await store.byId('series-1')

    // assert
    expect(result).toEqual(row)
    expect(byId).not.toHaveBeenCalled()
  })

  it('byId fetches once and caches the row when it is absent', async () => {
    // arrange
    const fetched = makeSeries({ id: 'series-2', title: 'Fetched' })
    const byId = vi.spyOn(api.series, 'byId').mockResolvedValue(fetched)

    const store = useSeries()

    // act
    const first = await store.byId('series-2')
    const second = await store.byId('series-2')

    // assert
    expect(first).toEqual(fetched)
    expect(second).toEqual(fetched)
    expect(byId).toHaveBeenCalledExactlyOnceWith('series-2')
    expect(store.all).toEqual([fetched])
  })

  it('delete removes the row and calls the API', async () => {
    // arrange
    const kept = makeSeries({ id: 'series-0', title: 'Kept' })
    const removed = makeSeries({ id: 'series-2', title: 'Removed' })
    vi.spyOn(api.series, 'delete').mockResolvedValue('')

    const store = useSeries()
    store.all = [kept, removed]

    // act
    await store.delete('series-2')

    // assert
    expect(store.all).toEqual([kept])
    expect(api.series.delete).toHaveBeenCalledExactlyOnceWith('series-2')
  })

  it('update sends a picked file through the multipart save and takes the server poster', async () => {
    // arrange
    const existed = makeSeries({ poster: '/images/series-1.jpg', posterSource: 'https://cdn/old.jpg' })
    const revised = makeSeries({ poster: '/images/series-1.png', posterSource: null })
    const file = new File([new Uint8Array([1])], 'poster.png', { type: 'image/png' })

    const savePoster = vi.spyOn(api.series, 'savePoster').mockResolvedValue(revised)
    const patch = vi.spyOn(api.series, 'patch')

    const store = useSeries()
    store.all = [existed]

    // act
    await store.update('series-1', { title: 'Some Series' } as SeriesUpdate, file)

    // assert
    expect(savePoster).toHaveBeenCalledExactlyOnceWith('series-1', { title: 'Some Series' }, file)
    expect(patch).not.toHaveBeenCalled()
    expect(store.all[0].poster).toBe('/images/series-1.png')
    expect(store.all[0].posterSource).toBeNull()
  })

  it('update without a file patches the row and takes the server poster', async () => {
    // arrange
    const existed = makeSeries({ poster: '/images/series-1.jpg', posterSource: 'https://cdn/old.jpg' })
    const revised = makeSeries({ poster: '/images/series-1.png', posterSource: 'https://cdn/new.jpg' })

    const patch = vi.spyOn(api.series, 'patch').mockResolvedValue(revised)
    const savePoster = vi.spyOn(api.series, 'savePoster')

    const store = useSeries()
    store.all = [existed]

    // act
    await store.update('series-1', { title: 'Some Series' } as SeriesUpdate)

    // assert
    expect(patch).toHaveBeenCalledExactlyOnceWith('series-1', { title: 'Some Series' })
    expect(savePoster).not.toHaveBeenCalled()
    expect(store.all[0].poster).toBe('/images/series-1.png')
    expect(store.all[0].posterSource).toBe('https://cdn/new.jpg')
  })

  it('redownloadPoster merges the server response', async () => {
    // arrange
    const existed = makeSeries({ poster: '/images/series-1.jpg', posterSource: null })
    const revised = makeSeries({ poster: '/images/series-1.jpg', posterSource: 'https://cdn/poster.jpg' })
    vi.spyOn(api.poster, 'redownload').mockResolvedValue(revised)

    const store = useSeries()
    store.all = [existed]

    // act
    await store.redownloadPoster('series-1')

    // assert
    expect(api.poster.redownload).toHaveBeenCalledExactlyOnceWith('series-1')
    expect(store.all[0].poster).toBe('/images/series-1.jpg')
    expect(store.all[0].posterSource).toBe('https://cdn/poster.jpg')
  })

  it('markAsViewed sets the view optimistically before the request resolves', async () => {
    // arrange
    let resolve!: (view: SeriesView) => void
    const pending = new Promise<SeriesView>((done) => {
      resolve = done
    })
    const markAsViewed = vi.spyOn(api.series, 'markAsViewed').mockReturnValue(pending)

    const store = useSeries()
    store.all = [makeSeries()]

    // act
    const saving = store.markAsViewed('series-1', '2024-05-06', 8, 'Great')

    // assert
    expect(store.all[0].seen).toBe('2024-05-06')
    expect(store.all[0].seenRating).toBe(8)
    expect(store.all[0].seenComment).toBe('Great')

    // act
    resolve({} as SeriesView)
    await saving

    // assert
    expect(markAsViewed).toHaveBeenCalledExactlyOnceWith('series-1', '2024-05-06', 8, 'Great')
  })

  it('removeSeriesView clears seen optimistically before the request resolves', async () => {
    // arrange
    let resolve!: (value: string) => void
    const pending = new Promise<string>((done) => {
      resolve = done
    })
    const removeSeriesView = vi.spyOn(api.series, 'removeSeriesView').mockReturnValue(pending)

    const store = useSeries()
    store.all = [makeSeries({ seen: '2024-05-06', seenRating: 8, seenComment: 'Great' })]

    // act
    const removing = store.removeSeriesView('series-1')

    // assert
    expect(store.all[0].seen).toBeNull()

    // act
    resolve('')
    await removing

    // assert
    expect(removeSeriesView).toHaveBeenCalledExactlyOnceWith('series-1')
  })

  it('setSeason stamps the old season and drops history from newer seasons', async () => {
    // arrange
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-05-06T10:00:00Z'))

    const existed = makeSeries({
      season: 1,
      seasonHistory: { '1': '2024-01-01', '2': '2024-02-02', '4': '2024-04-04' },
    })
    const patch = vi.spyOn(api.series, 'patch').mockResolvedValue(makeSeries({ season: 3 }))

    const store = useSeries()
    store.all = [existed]

    // act
    await store.setSeason('series-1', 3)

    // assert
    expect(store.all[0].season).toBe(3)
    expect(store.all[0].seasonHistory).toEqual({ '1': '2024-05-06', '2': '2024-02-02' })
    expect(patch).toHaveBeenCalledExactlyOnceWith('series-1', {
      season: 3,
      seasonHistory: { '1': '2024-05-06', '2': '2024-02-02' },
    })
  })
})

describe('useSeries refreshData', () => {
  it('does nothing for a row that did not come from omdb', async () => {
    // arrange
    const search = vi.spyOn(api.search, 'byId')
    const patch = vi.spyOn(api.series, 'patch')

    const store = useSeries()
    store.all = [makeSeries({ provider: 'manual' })]

    // act
    await store.refreshData('series-1')

    // assert
    expect(search).not.toHaveBeenCalled()
    expect(patch).not.toHaveBeenCalled()
  })

  it('merges the omdb details, keeps N/A values out and merges the patched row', async () => {
    // arrange
    const existed = makeSeries({
      title: 'Old Title',
      rating: 8,
      year: 2021,
      genre: 'Sci-Fi',
      poster: '/images/series-1.jpg',
      posterSource: 'https://cdn/old.jpg',
      extra: { Actors: 'Old Actor' },
    })
    const details: SearchItemDetails = {
      id: 'tt456',
      provider: 'omdb',
      title: 'New Title',
      type: 'series',
      year: 2022,
      poster: 'https://cdn/new.jpg',
      rating: 9,
      genre: 'Drama',
      extra: { Actors: 'New Actor', Runtime: 'N/A', totalSeasons: '5' },
    }
    vi.spyOn(api.search, 'byId').mockResolvedValue(details)
    const patch = vi.spyOn(api.series, 'patch').mockResolvedValue(
      makeSeries({
        title: 'New Title',
        year: 2022,
        rating: 9,
        genre: 'Drama',
        poster: '/images/series-1.png',
        posterSource: 'https://cdn/new.jpg',
        extra: { Actors: 'New Actor', totalSeasons: '5' },
      }),
    )

    const store = useSeries()
    store.all = [existed]

    // act
    await store.refreshData('series-1')

    // assert
    expect(api.search.byId).toHaveBeenCalledExactlyOnceWith('tt456', 'omdb')
    expect(patch).toHaveBeenCalledExactlyOnceWith('series-1', {
      title: 'New Title',
      rating: 9,
      year: 2022,
      poster: 'https://cdn/new.jpg',
      genre: 'Drama',
      extra: { Actors: 'New Actor', totalSeasons: '5' },
    })
    expect(store.all[0].poster).toBe('/images/series-1.png')
    expect(store.all[0].extra).toEqual({ Actors: 'New Actor', totalSeasons: '5' })
  })

  it('keeps the existing values when the search response is empty', async () => {
    // arrange
    const existed = makeSeries({
      title: 'Old Title',
      rating: 8,
      year: 2021,
      genre: 'Sci-Fi',
      poster: '/images/series-1.jpg',
      posterSource: 'https://cdn/old.jpg',
      extra: {},
    })
    const details: SearchItemDetails = {
      id: 'tt456',
      provider: 'omdb',
      title: '',
      type: 'series',
      year: null,
      poster: null,
      rating: null,
      genre: null,
      extra: {},
    }
    vi.spyOn(api.search, 'byId').mockResolvedValue(details)
    const patch = vi.spyOn(api.series, 'patch').mockResolvedValue(existed)

    const store = useSeries()
    store.all = [existed]

    // act
    await store.refreshData('series-1')

    // assert
    expect(patch).toHaveBeenCalledExactlyOnceWith('series-1', {
      title: 'Old Title',
      rating: 8,
      year: 2021,
      poster: 'https://cdn/old.jpg',
      genre: 'Sci-Fi',
      extra: {},
    })
  })

  it('falls back to the stored poster path when no source url exists', async () => {
    // arrange
    const existed = makeSeries({
      title: 'Old Title',
      poster: '/images/series-1.jpg',
      posterSource: null,
      extra: {},
    })
    const details: SearchItemDetails = {
      id: 'tt456',
      provider: 'omdb',
      title: 'Old Title',
      type: 'series',
      poster: null,
      extra: {},
    }
    vi.spyOn(api.search, 'byId').mockResolvedValue(details)
    const patch = vi.spyOn(api.series, 'patch').mockResolvedValue(existed)

    const store = useSeries()
    store.all = [existed]

    // act
    await store.refreshData('series-1')

    // assert
    expect(patch).toHaveBeenCalledWith('series-1', expect.objectContaining({ poster: '/images/series-1.jpg' }))
  })
})
