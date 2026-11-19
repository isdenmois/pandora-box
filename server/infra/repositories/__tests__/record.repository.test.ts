import { randomUUID } from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Poster files live on disk; these tests assert the decision, not the file store.
vi.mock('../poster.instance', () => ({
  posterRepository: { remove: vi.fn() },
}))

const { movieRepository, seriesRepository, posterRepository } = await import('@server/infra')
const { insertMovie, insertSeries, resetDatabase } = await import('./db-fixtures')

describe('movie repository', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    await resetDatabase()
  })

  it('lists every global row plus only my own private rows', async () => {
    // arrange
    const globalByCreator = await insertMovie({ createdBy: 'creator', private: false })
    const globalByOther = await insertMovie({ createdBy: 'other', private: false })
    const privateByCreator = await insertMovie({ createdBy: 'creator', private: true })
    const privateByOther = await insertMovie({ createdBy: 'other', private: true })
    const myPrivate = await insertMovie({ createdBy: 'reader', private: true })

    // act
    const rows = await movieRepository.getAll('reader')

    // assert
    const ids = rows.map((row) => row.id)
    expect(ids).toEqual(expect.arrayContaining([globalByCreator, globalByOther, myPrivate]))
    expect(ids).not.toContain(privateByCreator)
    expect(ids).not.toContain(privateByOther)
  })

  it('transfers a global row to the user who makes it private', async () => {
    // arrange
    const id = await insertMovie({ createdBy: 'creator', private: false, recommendedBy: 'editor' })

    // act
    const saved = await movieRepository.update(id, { private: true }, undefined, 'editor')

    // assert
    expect(saved?.createdBy).toBe('editor')
    expect(saved?.private).toBe(true)
    // The claim made the recommender the creator, so the credit is dropped.
    expect(saved?.recommendedBy).toBeNull()
    expect((await movieRepository.byId(id))?.createdBy).toBe('editor')
  })

  it('keeps the owner and the recommender when the creator makes their own row private', async () => {
    // arrange
    const id = await insertMovie({ createdBy: 'editor', private: false, recommendedBy: 'friend' })

    // act
    const saved = await movieRepository.update(id, { private: true }, undefined, 'editor')

    // assert
    expect(saved?.createdBy).toBe('editor')
    expect(saved?.recommendedBy).toBe('friend')
  })

  it('localizes a new poster source and drops the stale file', async () => {
    // arrange
    const id = await insertMovie({ poster: null, posterSource: null })

    // act
    const saved = await movieRepository.update(id, { poster: 'https://cdn.example.com/a.png' })

    // assert
    expect(saved?.poster).toBe(`/images/${id}.png`)
    expect(saved?.posterSource).toBe('https://cdn.example.com/a.png')
    expect(posterRepository.remove).toHaveBeenCalledExactlyOnceWith(id)
  })

  it('does not touch the stored file when the source is replayed', async () => {
    // arrange
    const id = randomUUID()
    const source = 'https://cdn.example.com/a'
    await insertMovie({ id, poster: `/images/${id}.png`, posterSource: source })

    // act
    const saved = await movieRepository.update(id, { poster: source })

    // assert
    expect(saved?.poster).toBe(`/images/${id}.png`)
    expect(saved?.posterSource).toBe(source)
    expect(posterRepository.remove).not.toHaveBeenCalled()
  })

  it('deletes the row and its stored file', async () => {
    // arrange
    const id = await insertMovie()

    // act
    await movieRepository.delete(id)

    // assert
    expect(await movieRepository.byId(id)).toBeNull()
    expect(posterRepository.remove).toHaveBeenCalledExactlyOnceWith(id)
  })
})

describe('movie views', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    await resetDatabase()
  })

  it('records a view and mirrors it on the row', async () => {
    // arrange
    const id = await insertMovie()

    // act
    const view = await movieRepository.markAsViewed(id, 'user-1', '2024-05-06', 8, 'Loved it')

    // assert
    expect(view).toMatchObject({ movieId: id, userId: 'user-1', date: '2024-05-06', rating: 8 })
    expect(await movieRepository.getViews('user-1')).toHaveLength(1)
    expect(await movieRepository.byId(id)).toMatchObject({
      seen: '2024-05-06',
      seenRating: 8,
      seenComment: 'Loved it',
    })
  })

  it('removes the view and clears the row fields', async () => {
    // arrange
    const id = await insertMovie()
    await movieRepository.markAsViewed(id, 'user-1', '2024-05-06', 8, 'Loved it')

    // act
    await movieRepository.removeMovieView(id)

    // assert
    expect(await movieRepository.getViews('user-1')).toHaveLength(0)
    expect((await movieRepository.byId(id))?.seen).toBeNull()
  })
})

describe('series repository', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    await resetDatabase()
  })

  it('applies the same claim rules as movies', async () => {
    // arrange
    const id = await insertSeries({ createdBy: 'creator', private: false, recommendedBy: 'editor' })

    // act
    const saved = await seriesRepository.update(id, { private: true }, undefined, 'editor')

    // assert
    expect(saved?.createdBy).toBe('editor')
    expect(saved?.recommendedBy).toBeNull()
  })

  it('stores the season and its history', async () => {
    // arrange
    const id = await insertSeries({ season: 1, seasonHistory: null })

    // act
    const saved = await seriesRepository.update(id, {
      season: 2,
      seasonHistory: { '1': '2024-01-02' },
    })

    // assert
    expect(saved?.season).toBe(2)
    expect(saved?.seasonHistory).toEqual({ '1': '2024-01-02' })
  })

  it('records and removes a series view', async () => {
    // arrange
    const id = await insertSeries()

    // act
    await seriesRepository.markAsViewed(id, 'user-1', '2024-05-06', 9, 'Great')
    const withView = await seriesRepository.byId(id)
    await seriesRepository.removeSeriesView(id)

    // assert
    expect(withView).toMatchObject({ seen: '2024-05-06', seenRating: 9, seenComment: 'Great' })
    expect(await seriesRepository.getViews('user-1')).toHaveLength(0)
    expect((await seriesRepository.byId(id))?.seen).toBeNull()
  })
})
