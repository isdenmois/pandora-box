import { describe, expect, it } from 'vitest'
import { normalizeRow } from '../backup-fields'

const OLD_ROW = {
  id: 'movie-1',
  title: 'Old Movie',
  poster: 'https://cdn.example.com/poster.jpg',
  userId: 'user-1',
  private: null,
}

describe('backup row normalization', () => {
  it('maps a legacy userId to createdBy and drops the old key', () => {
    // act
    const row = normalizeRow('movie', OLD_ROW, 'admin-id')

    // assert
    expect(row).toMatchObject({ createdBy: 'user-1', recommendedBy: null, private: false })
    expect(row).not.toHaveProperty('userId')
  })

  it('assigns an ownerless row to the fallback creator', () => {
    // act
    const row = normalizeRow('movie', { ...OLD_ROW, userId: null }, 'admin-id')

    // assert
    expect(row).toMatchObject({ createdBy: 'admin-id' })
  })

  it('keeps a createdBy written by the new version', () => {
    // act
    const row = normalizeRow('movie', { ...OLD_ROW, createdBy: 'new-id', userId: 'old-id' }, 'admin-id')

    // assert
    expect(row).toMatchObject({ createdBy: 'new-id' })
  })

  it('localizes a pre-split remote poster', () => {
    // act
    const row = normalizeRow('movie', OLD_ROW, 'admin-id')

    // assert
    expect(row).toMatchObject({
      poster: '/images/movie-1.jpg',
      posterSource: 'https://cdn.example.com/poster.jpg',
    })
  })

  it('refuses to restore an ownerless row without a fallback', () => {
    // act + assert
    expect(() => normalizeRow('movie', { ...OLD_ROW, userId: null }, null)).toThrow(
      'Backup contains rows without an owner',
    )
  })
})
