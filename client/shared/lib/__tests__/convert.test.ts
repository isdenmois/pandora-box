import { describe, expect, it } from 'vitest'
import { toNullable, toNumber } from '../convert'

describe('toNumber', () => {
  it('maps an empty string to null', () => {
    // arrange
    // act
    const result = toNumber('')

    // assert
    expect(result).toBeNull()
  })

  it('keeps zero out of the null branch', () => {
    // arrange
    // act
    const result = toNumber('0')

    // assert
    expect(result).toBe(0)
  })

  it('parses a decimal value', () => {
    // arrange
    // act
    const result = toNumber('7.5')

    // assert
    expect(result).toBe(7.5)
  })
})

describe('toNullable', () => {
  it('maps an empty string to null', () => {
    // arrange
    // act
    const result = toNullable('')

    // assert
    expect(result).toBeNull()
  })

  it('keeps a non-empty string', () => {
    // arrange
    // act
    const result = toNullable('x')

    // assert
    expect(result).toBe('x')
  })
})
