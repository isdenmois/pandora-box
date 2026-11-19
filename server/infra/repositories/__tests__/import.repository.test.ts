import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../search-repository', () => ({
  searchRepository: { getById: vi.fn() },
}))

// The importer sleeps 5 s per item to stay under OMDB's rate limit; tests must not wait for it.
vi.mock('@server/shared', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@server/shared')>()),
  sleep: vi.fn(() => Promise.resolve()),
}))

const { importRepository, movieRepository, seriesRepository } = await import('@server/infra')
const { searchRepository } = await import('../search-repository')
const { insertSeries, resetDatabase } = await import('./db-fixtures')

const foundMovie = {
  id: 'tt1',
  provider: 'omdb',
  title: 'Found Movie',
  poster: 'https://cdn.example.com/poster.png',
  year: 1999,
  rating: 8.1,
  language: 'English',
  genre: 'Drama',
  extra: { Director: 'Someone' },
} as never

const foundSeries = {
  id: 'tt2',
  provider: 'omdb',
  title: 'Found Series',
  poster: null,
  year: 2001,
  rating: 7.2,
  language: 'English',
  genre: 'Comedy',
  extra: { totalSeasons: '5' },
} as never

describe('import repository', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    await resetDatabase()
  })

  it('creates a movie owned by the importer from provider data', async () => {
    // arrange
    vi.mocked(searchRepository.getById).mockResolvedValue(foundMovie)

    // act
    await importRepository.import('importer', {
      movies: [{ extId: 'tt1', reason: 'why', private: true }],
      series: [],
    })

    // assert
    expect(searchRepository.getById).toHaveBeenCalledExactlyOnceWith('omdb', 'tt1')
    const [row] = await movieRepository.getAll('importer')
    expect(row).toMatchObject({
      extId: 'tt1',
      provider: 'omdb',
      title: 'Found Movie',
      year: 1999,
      rating: 8.1,
      language: 'English',
      genre: 'Drama',
      reason: 'why',
      createdBy: 'importer',
      private: true,
      recommendedBy: null,
    })
    expect(row?.poster).toBe(`/images/${row?.id}.png`)
    expect(row?.posterSource).toBe('https://cdn.example.com/poster.png')
    expect(row?.extra).toEqual({ Director: 'Someone' })
  })

  it('ignores the legacy userId from an old installation', async () => {
    // arrange
    vi.mocked(searchRepository.getById).mockResolvedValue(foundMovie)

    // act
    await importRepository.import('importer', {
      movies: [{ extId: 'tt1', userId: 'someone-else' }],
      series: [],
    })

    // assert
    expect((await movieRepository.getAll('importer'))[0]?.createdBy).toBe('importer')
  })

  it('updates an existing row without stealing its creator', async () => {
    // arrange
    const seriesId = await insertSeries({
      extId: 'tt9',
      title: 'Existing',
      createdBy: 'original',
      season: 4,
      reason: 'old',
      private: false,
    })

    // act
    await importRepository.import('importer', {
      movies: [],
      series: [{ extId: 'tt9', reason: 'new', private: true }],
    })

    // assert
    expect(searchRepository.getById).not.toHaveBeenCalled()
    const row = await seriesRepository.byId(seriesId)
    expect(row).toMatchObject({
      title: 'Existing',
      createdBy: 'original',
      season: 4,
      reason: 'new',
      private: true,
    })
  })

  it('creates nothing when the provider does not know the id', async () => {
    // arrange
    vi.mocked(searchRepository.getById).mockResolvedValue(null)

    // act
    await importRepository.import('importer', { movies: [{ extId: 'tt404' }], series: [] })

    // assert
    expect(await movieRepository.getAll('importer')).toHaveLength(0)
  })

  it('creates a series with the imported season and provider extras', async () => {
    // arrange
    vi.mocked(searchRepository.getById).mockResolvedValue(foundSeries)

    // act
    await importRepository.import('importer', {
      movies: [],
      series: [{ extId: 'tt2', season: 3 }],
    })

    // assert
    const [row] = await seriesRepository.getAll('importer')
    expect(row).toMatchObject({
      extId: 'tt2',
      title: 'Found Series',
      season: 3,
      rating: 7.2,
      createdBy: 'importer',
    })
    expect(row?.extra).toEqual({ totalSeasons: '5' })
  })

  it('keeps going when one item fails and reports the final counts', async () => {
    // arrange
    vi.mocked(searchRepository.getById).mockRejectedValueOnce('provider exploded').mockResolvedValueOnce(foundMovie)

    // act
    await importRepository.import('importer', {
      movies: [{ extId: 'tt-bad' }, { extId: 'tt1' }],
      series: [],
    })

    // assert
    expect(searchRepository.getById).toHaveBeenCalledTimes(2)
    expect(await movieRepository.getAll('importer')).toHaveLength(1)
    expect(importRepository.status()).toMatchObject({
      inProgress: false,
      movies: { finished: 2, total: 2 },
      series: { finished: 0, total: 0 },
    })
  })

  it('does not start a second import while one is running', async () => {
    // arrange
    let finishProvider: (value: unknown) => void = () => {}
    const pending = new Promise((resolve) => {
      finishProvider = resolve
    })
    vi.mocked(searchRepository.getById).mockReturnValue(pending as never)

    // act
    const first = importRepository.import('importer', { movies: [{ extId: 'tt1' }], series: [] })
    const second = await importRepository.import('importer', { movies: [{ extId: 'tt2' }], series: [] })
    finishProvider(foundMovie)
    await first

    // assert
    expect(second).toEqual({ ok: true })
    expect(searchRepository.getById).toHaveBeenCalledExactlyOnceWith('omdb', 'tt1')
    expect(await movieRepository.getAll('importer')).toHaveLength(1)
  })
})
