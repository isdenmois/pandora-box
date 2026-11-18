import { describe, expect, it } from 'vitest'
import { isOmdb, isOmdbString } from '../is-omdb'

describe('isOmdb', () => {
  it('accepts a row whose provider is omdb', () => {
    // arrange
    const row = { provider: 'omdb' }

    // act
    const result = isOmdb(row)

    // assert
    expect(result).toBe(true)
  })

  it('rejects other providers and a missing provider', () => {
    // arrange
    const manual = { provider: 'manual' }
    const none = {}

    // act
    const results = [isOmdb(manual), isOmdb(none)]

    // assert
    expect(results).toEqual([false, false])
  })
})

describe('isOmdbString', () => {
  it('accepts a normal string', () => {
    // arrange
    // act
    const result = isOmdbString('Tom Hanks')

    // assert
    expect(result).toBe(true)
  })

  it('rejects the N/A placeholder', () => {
    // arrange
    // act
    const result = isOmdbString('N/A')

    // assert
    expect(result).toBe(false)
  })

  it('rejects non-strings', () => {
    // arrange
    const values = [null, undefined, 42, { value: 'N/A' }]

    // act
    const results = values.map(isOmdbString)

    // assert
    expect(results).toEqual([false, false, false, false])
  })
})
