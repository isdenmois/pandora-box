import { beforeEach, describe, expect, it } from 'vitest'

const { attributionRepository } = await import('@server/infra')
const { insertMovie, insertSeries, resetDatabase } = await import('./db-fixtures')

describe('attribution reassign', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  it('moves the selected global rows to the target creator', async () => {
    // arrange
    const movieId = await insertMovie({ createdBy: 'old', private: false })
    const seriesId = await insertSeries({ createdBy: 'old', private: false })

    // act
    const result = await attributionRepository.reassign({
      movies: [movieId],
      series: [seriesId],
      createdBy: 'new',
    })

    // assert
    expect(result).toEqual({ ok: true, updated: 2 })
    expect((await attributionRepository.getGlobal()).movies[0]?.createdBy).toBe('new')
    expect((await attributionRepository.getGlobal()).series[0]?.createdBy).toBe('new')
  })

  it('drops a recommendation that would point at the new creator', async () => {
    // arrange
    const movieId = await insertMovie({ createdBy: 'old', recommendedBy: 'new', private: false })
    const seriesId = await insertSeries({ createdBy: 'old', recommendedBy: 'new', private: false })

    // act
    await attributionRepository.reassign({ movies: [movieId], series: [seriesId], createdBy: 'new' })

    // assert
    const { movies, series } = await attributionRepository.getGlobal()
    expect(movies[0]?.recommendedBy).toBeNull()
    expect(series[0]?.recommendedBy).toBeNull()
  })

  it('ignores duplicate ids', async () => {
    // arrange
    const movieId = await insertMovie({ createdBy: 'old', private: false })

    // act
    const result = await attributionRepository.reassign({
      movies: [movieId, movieId],
      series: [],
      createdBy: 'new',
    })

    // assert
    expect(result).toEqual({ ok: true, updated: 1 })
  })

  it('refuses the whole batch when one selected row is private', async () => {
    // arrange
    const globalId = await insertMovie({ createdBy: 'old', private: false })
    const privateId = await insertSeries({ createdBy: 'old', private: true })

    // act
    const result = await attributionRepository.reassign({
      movies: [globalId],
      series: [privateId],
      createdBy: 'new',
    })

    // assert
    expect(result).toEqual({ ok: false, reason: 'unavailable' })
    // Nothing was applied, including the valid movie.
    const { movies, series } = await attributionRepository.getGlobal()
    expect(movies[0]?.createdBy).toBe('old')
    expect(series).toHaveLength(0)
  })

  it('refuses the batch when a selected row no longer exists', async () => {
    // arrange
    const movieId = await insertMovie({ createdBy: 'old', private: false })

    // act
    const result = await attributionRepository.reassign({
      movies: [movieId, 'missing'],
      series: [],
      createdBy: 'new',
    })

    // assert
    expect(result).toEqual({ ok: false, reason: 'unavailable' })
    expect((await attributionRepository.getGlobal()).movies[0]?.createdBy).toBe('old')
  })

  it('only lists shared rows', async () => {
    // arrange
    await insertMovie({ createdBy: 'old', private: false })
    await insertMovie({ createdBy: 'old', private: true })
    await insertSeries({ createdBy: 'old', private: true })

    // act
    const { movies, series } = await attributionRepository.getGlobal()

    // assert
    expect(movies).toHaveLength(1)
    expect(series).toHaveLength(0)
  })
})
