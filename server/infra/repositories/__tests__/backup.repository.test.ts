import { beforeEach, describe, expect, it } from 'vitest'

const { backupRepository, movieRepository } = await import('@/infra')
const { insertMovie, insertUser, resetDatabase } = await import('./db-fixtures')

type Backup = Parameters<typeof backupRepository.restore>[0]

const backup = (overrides: Partial<Record<string, unknown[]>> = {}): Backup =>
  ({
    user: [],
    movie: [],
    movieView: [],
    series: [],
    seriesView: [],
    ...overrides,
  }) as Backup

const admin = { id: 'admin-1', username: 'admin', passwordHash: 'hash', role: 'admin' }

describe('backup create', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  it('exports every table in the backup shape', async () => {
    // arrange
    await insertUser('user-1')
    await insertMovie({ createdBy: 'user-1' })

    // act
    const data = await backupRepository.create()

    // assert
    expect(Object.keys(data).sort()).toEqual(['movie', 'movieView', 'series', 'seriesView', 'user'])
    expect(data.movie).toHaveLength(1)
    expect(data.user).toHaveLength(1)
  })
})

describe('backup restore', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  it('replaces the tables in the payload', async () => {
    // arrange
    const staleId = await insertMovie({ title: 'Stale' })
    const data = backup({
      user: [admin],
      movie: [{ id: 'movie-1', title: 'Restored', createdBy: 'admin-1', private: false }],
    })

    // act
    await backupRepository.restore(data)

    // assert
    expect(await movieRepository.byId(staleId)).toBeNull()
    expect(await movieRepository.byId('movie-1')).toMatchObject({ title: 'Restored', createdBy: 'admin-1' })
  })

  it('maps a legacy userId to the creator and localizes a pre-split poster', async () => {
    // arrange
    const data = backup({
      user: [admin],
      movie: [
        {
          id: 'movie-1',
          title: 'Legacy',
          userId: 'legacy-user',
          poster: 'https://cdn.example.com/poster.png',
        },
      ],
    })

    // act
    await backupRepository.restore(data)

    // assert
    const row = await movieRepository.byId('movie-1')
    expect(row).toMatchObject({
      createdBy: 'legacy-user',
      poster: '/images/movie-1.png',
      posterSource: 'https://cdn.example.com/poster.png',
      recommendedBy: null,
      private: false,
    })
  })

  it('assigns an ownerless row to the first admin in the backup', async () => {
    // arrange
    const data = backup({
      user: [admin, { id: 'user-1', username: 'user', passwordHash: 'hash', role: 'user' }],
      movie: [{ id: 'movie-1', title: 'Ownerless' }],
    })

    // act
    await backupRepository.restore(data)

    // assert
    expect((await movieRepository.byId('movie-1'))?.createdBy).toBe('admin-1')
  })

  it('leaves tables the payload omits untouched', async () => {
    // arrange
    await insertUser('user-1')
    const movieId = await insertMovie({ createdBy: 'user-1' })
    const data = backup({ user: [admin] })
    delete (data as Partial<Backup>).movie
    delete (data as Partial<Backup>).movieView

    // act
    await backupRepository.restore(data)

    // assert
    expect(await movieRepository.byId(movieId)).not.toBeNull()
  })

  it('rolls back and keeps the old rows when a row has no owner and no fallback user', async () => {
    // arrange
    const oldId = await insertMovie({ title: 'Old' })
    const data = backup({ user: [], movie: [{ id: 'movie-1', title: 'Ownerless' }] })

    // act
    const restore = backupRepository.restore(data)

    // assert
    await expect(restore).rejects.toThrow('Backup contains rows without an owner')
    expect(await movieRepository.byId(oldId)).not.toBeNull()
  })
})
