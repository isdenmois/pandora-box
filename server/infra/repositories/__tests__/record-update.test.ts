import { describe, expect, it } from 'vitest'
import { recordUpdateFor, type StoredRecord } from '../record-update'

const storedRecord = (overrides: Partial<StoredRecord> = {}): StoredRecord => ({
  poster: null,
  posterSource: null,
  createdBy: 'creator',
  private: false,
  recommendedBy: null,
  ...overrides,
})

describe('recordUpdateFor', () => {
  describe('claiming a shared row', () => {
    it('transfers a global row to the editor who makes it private', () => {
      // arrange
      const stored = storedRecord()
      const data = { private: true }

      // act
      const { values } = recordUpdateFor('record-1', data, stored, undefined, 'editor')

      // assert
      expect(values.createdBy).toBe('editor')
      expect(values.private).toBe(true)
    })

    it('keeps the creator when they make their own row private', () => {
      // arrange
      const stored = storedRecord({ createdBy: 'editor' })
      const data = { private: true }

      // act
      const { values } = recordUpdateFor('record-1', data, stored, undefined, 'editor')

      // assert
      expect(values.createdBy).toBeUndefined()
      expect(values.private).toBe(true)
    })

    it('does not transfer an already private row', () => {
      // arrange
      const stored = storedRecord({ private: true })
      const data = { private: true }

      // act
      const { values } = recordUpdateFor('record-1', data, stored, undefined, 'editor')

      // assert
      expect(values.createdBy).toBeUndefined()
    })

    it('does not transfer when the patch leaves visibility unchanged', () => {
      // arrange
      const stored = storedRecord()
      const data = { title: 'Renamed' }

      // act
      const { values } = recordUpdateFor('record-1', data, stored, undefined, 'editor')

      // assert
      expect(values).toEqual({ title: 'Renamed' })
    })

    it('does not transfer without an editor id', () => {
      // arrange
      const stored = storedRecord()
      const data = { private: true }

      // act
      const { values } = recordUpdateFor('record-1', data, stored, undefined, undefined)

      // assert
      expect(values.createdBy).toBeUndefined()
    })
  })

  describe('recommender after a claim', () => {
    it('drops a recommender the patch would make the new creator', () => {
      // arrange
      const stored = storedRecord({ recommendedBy: 'someone-else' })
      const data = { private: true, recommendedBy: 'editor' }

      // act
      const { values } = recordUpdateFor('record-1', data, stored, undefined, 'editor')

      // assert
      expect(values.createdBy).toBe('editor')
      expect(values.recommendedBy).toBeNull()
    })

    it('drops the stored recommender when the patch omits it', () => {
      // arrange
      const stored = storedRecord({ recommendedBy: 'editor' })
      const data = { private: true }

      // act
      const { values } = recordUpdateFor('record-1', data, stored, undefined, 'editor')

      // assert
      expect(values.recommendedBy).toBeNull()
    })

    it('keeps a recommender who is not the new creator', () => {
      // arrange
      const stored = storedRecord({ recommendedBy: 'someone-else' })
      const data = { private: true }

      // act
      const { values } = recordUpdateFor('record-1', data, stored, undefined, 'editor')

      // assert
      expect(values.recommendedBy).toBeUndefined()
    })
  })

  describe('poster changes', () => {
    it('points the row at an uploaded file and clears the source', () => {
      // arrange
      const stored = storedRecord({
        poster: '/images/record-1.jpg',
        posterSource: 'https://cdn.example.com/old.jpg',
      })

      // act
      const { values, removeFile } = recordUpdateFor('record-1', {}, stored, '/images/record-1.png', 'editor')

      // assert
      expect(values.poster).toBe('/images/record-1.png')
      expect(values.posterSource).toBeNull()
      // The save writes a new file and drops the old extension by itself.
      expect(removeFile).toBe(false)
    })

    it('replays an unchanged remote source without re-guessing the stored path', () => {
      // arrange
      const stored = storedRecord({
        poster: '/images/record-1.png',
        posterSource: 'https://cdn.example.com/poster',
      })
      const data = { poster: 'https://cdn.example.com/poster', title: 'Renamed' }

      // act
      const { values, removeFile } = recordUpdateFor('record-1', data, stored, undefined, 'editor')

      // assert
      expect(values).toEqual({ title: 'Renamed' })
      expect(removeFile).toBe(false)
    })

    it('flags the stored file when the source changes', () => {
      // arrange
      const stored = storedRecord({
        poster: '/images/record-1.jpg',
        posterSource: 'https://cdn.example.com/old.jpg',
      })
      const data = { poster: 'https://cdn.example.com/new.png' }

      // act
      const { values, removeFile } = recordUpdateFor('record-1', data, stored, undefined, 'editor')

      // assert
      expect(values.poster).toBe('/images/record-1.png')
      expect(values.posterSource).toBe('https://cdn.example.com/new.png')
      expect(removeFile).toBe(true)
    })

    it('clears both poster columns and the stored file when the poster is removed', () => {
      // arrange
      const stored = storedRecord({
        poster: '/images/record-1.jpg',
        posterSource: 'https://cdn.example.com/old.jpg',
      })
      const data = { poster: null }

      // act
      const { values, removeFile } = recordUpdateFor('record-1', data, stored, undefined, 'editor')

      // assert
      expect(values).toEqual({ poster: null, posterSource: null })
      expect(removeFile).toBe(true)
    })

    it('produces no values for a patch that changes nothing', () => {
      // arrange
      const stored = storedRecord()

      // act
      const { values, removeFile } = recordUpdateFor('record-1', {}, stored, undefined, 'editor')

      // assert
      expect(values).toEqual({})
      expect(removeFile).toBe(false)
    })

    it('passes ordinary fields through when the row was not read', () => {
      // arrange
      const data = { title: 'Renamed', season: 3 }

      // act
      const { values } = recordUpdateFor('series-1', data, null, undefined, 'editor')

      // assert
      expect(values).toEqual({ title: 'Renamed', season: 3 })
    })
  })
})
