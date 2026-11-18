import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/infra', () => ({
  movieRepository: { byId: vi.fn() },
  seriesRepository: { byId: vi.fn() },
}))

const { movieRepository, seriesRepository } = await import('@/infra')
const { findPosterRow } = await import('../poster-record')

const MOVIE = {
  id: 'movie-1',
  title: 'A Movie',
  poster: '/images/movie-1.jpg',
  posterSource: 'https://cdn.test/movie-1.jpg',
  private: false,
  createdBy: 'reader',
}
const SERIES = {
  id: 'series-1',
  title: 'A Series',
  poster: '/images/series-1.png',
  posterSource: null,
  private: true,
  createdBy: 'someone-else',
}

describe('findPosterRow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(movieRepository.byId).mockResolvedValue(null)
    vi.mocked(seriesRepository.byId).mockResolvedValue(null)
  })

  it('returns the movie row and does not look up series when the id is a movie', async () => {
    // arrange
    vi.mocked(movieRepository.byId).mockResolvedValue(MOVIE as never)

    // act
    const row = await findPosterRow(MOVIE.id)

    // assert
    expect(row).toEqual({
      poster: MOVIE.poster,
      posterSource: MOVIE.posterSource,
      private: MOVIE.private,
      createdBy: MOVIE.createdBy,
    })
    expect(movieRepository.byId).toHaveBeenCalledExactlyOnceWith(MOVIE.id)
    expect(seriesRepository.byId).not.toHaveBeenCalled()
  })

  it('falls back to the series row when no movie matches', async () => {
    // arrange
    vi.mocked(seriesRepository.byId).mockResolvedValue(SERIES as never)

    // act
    const row = await findPosterRow(SERIES.id)

    // assert
    expect(row).toEqual({
      poster: SERIES.poster,
      posterSource: SERIES.posterSource,
      private: SERIES.private,
      createdBy: SERIES.createdBy,
    })
    expect(movieRepository.byId).toHaveBeenCalledExactlyOnceWith(SERIES.id)
    expect(seriesRepository.byId).toHaveBeenCalledExactlyOnceWith(SERIES.id)
  })

  it('returns null when neither table holds the id', async () => {
    // arrange
    // act
    const row = await findPosterRow('missing')

    // assert
    expect(row).toBeNull()
    expect(movieRepository.byId).toHaveBeenCalledExactlyOnceWith('missing')
    expect(seriesRepository.byId).toHaveBeenCalledExactlyOnceWith('missing')
  })

  it('carries only the poster fields, not the rest of the record', async () => {
    // arrange
    vi.mocked(seriesRepository.byId).mockResolvedValue(SERIES as never)

    // act
    const row = await findPosterRow(SERIES.id)

    // assert
    expect(row).not.toBeNull()
    expect(Object.keys(row ?? {}).sort()).toEqual(['createdBy', 'poster', 'posterSource', 'private'])
    expect(row).not.toHaveProperty('title')
    expect(row).not.toHaveProperty('id')
  })
})
