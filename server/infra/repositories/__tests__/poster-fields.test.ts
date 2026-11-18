import { describe, expect, it } from 'vitest'
import { posterFieldsFor, posterRestoreFor, posterUpdateFor } from '../poster-fields'

const ID = 'movie-1'
const SOURCE = 'https://cdn.example.com/poster.jpg'

describe('posterFieldsFor', () => {
  it('stores the local path and keeps the origin', () => {
    // act
    const fields = posterFieldsFor(ID, SOURCE)

    // assert
    expect(fields).toEqual({ poster: `/images/${ID}.jpg`, posterSource: SOURCE })
  })

  it('clears both fields when there is no poster', () => {
    // assert
    expect(posterFieldsFor(ID, null)).toEqual({ poster: null, posterSource: null })
    expect(posterFieldsFor(ID, '')).toEqual({ poster: null, posterSource: null })
  })

  it('accepts an already local path without inventing a source', () => {
    // act
    const fields = posterFieldsFor(ID, `/images/${ID}.png`)

    // assert
    expect(fields).toEqual({ poster: `/images/${ID}.png`, posterSource: null })
  })

  it('derives the extension from the url path, defaulting to jpg', () => {
    // assert
    expect(posterFieldsFor(ID, 'https://cdn.example.com/a/b.webp').poster).toBe(`/images/${ID}.webp`)
    expect(posterFieldsFor(ID, 'https://cdn.example.com/no-extension').poster).toBe(`/images/${ID}.jpg`)
  })
})

describe('posterUpdateFor', () => {
  const stored = { poster: `/images/${ID}.jpg`, posterSource: SOURCE }

  it('leaves an unchanged source alone, keeping the stored file', () => {
    // act
    const result = posterUpdateFor(ID, SOURCE, stored)

    // assert
    // Applying the guess again would rewrite the path; the stored one is the corrected one.
    expect(result.fields).toBeNull()
    expect(result.removeFile).toBe(false)
  })

  it('keeps a corrected extension when the source is replayed', () => {
    // arrange
    // The URL carries no extension, so the path was guessed as jpg and corrected to png on download.
    const corrected = { poster: `/images/${ID}.png`, posterSource: 'https://cdn.example.com/poster' }

    // act
    const result = posterUpdateFor(ID, 'https://cdn.example.com/poster', corrected)

    // assert
    expect(result.fields).toBeNull()
    expect(result.removeFile).toBe(false)
  })

  it('derives the path again when nothing local is stored yet', () => {
    // arrange
    // A row restored from a backup taken before the split still holds the remote URL.
    const legacy = { poster: SOURCE, posterSource: null }

    // act
    const result = posterUpdateFor(ID, SOURCE, legacy)

    // assert
    expect(result.fields).toEqual({ poster: `/images/${ID}.jpg`, posterSource: SOURCE })
    expect(result.removeFile).toBe(true)
  })

  it('treats a replay of the stored local path as a no-op', () => {
    // act
    const result = posterUpdateFor(ID, `/images/${ID}.jpg`, stored)

    // assert
    expect(result.fields).toBeNull()
    expect(result.removeFile).toBe(false)
  })

  it('keeps the source when the client sends a local path it learned from a redirect', () => {
    // arrange
    // The server corrected the extension, so the client's path differs from the stored one.
    const corrected = { poster: `/images/${ID}.png`, posterSource: SOURCE }

    // act
    const result = posterUpdateFor(ID, `/images/${ID}.jpg`, corrected)

    // assert
    // Taking the path would erase the source and make the poster permanently unrebuildable.
    expect(result.fields).toBeNull()
    expect(result.removeFile).toBe(false)
  })

  it('flags the stale file when the source changes', () => {
    // act
    const result = posterUpdateFor(ID, 'https://cdn.example.com/other.jpg', stored)

    // assert
    expect(result.removeFile).toBe(true)
    expect(result.fields?.posterSource).toBe('https://cdn.example.com/other.jpg')
  })

  it('flags the stale file when a poster is replaced with null', () => {
    // act
    const result = posterUpdateFor(ID, null, stored)

    // assert
    expect(result.removeFile).toBe(true)
    expect(result.fields).toEqual({ poster: null, posterSource: null })
  })
})

describe('posterRestoreFor', () => {
  it('localizes a remote poster from a backup taken before the split', () => {
    // act
    const fields = posterRestoreFor(ID, SOURCE)

    // assert
    expect(fields).toEqual({ poster: `/images/${ID}.jpg`, posterSource: SOURCE })
  })

  it('leaves a row that already carries a local path untouched', () => {
    // act + assert
    // Mapping it would run through posterFieldsFor, which drops the source of a local path.
    expect(posterRestoreFor(ID, `/images/${ID}.png`)).toBeNull()
  })

  it('leaves a row without a poster untouched', () => {
    // act + assert
    expect(posterRestoreFor(ID, null)).toBeNull()
  })
})
