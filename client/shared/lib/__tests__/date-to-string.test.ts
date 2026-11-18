import { describe, expect, it } from 'vitest'
import { dateToString } from '../date-to-string'

describe('dateToString', () => {
  it('zero-pads a single-digit month and day', () => {
    // arrange
    // Local-time construction keeps the assertion timezone-independent.
    const date = new Date(2024, 0, 5)

    // act
    const result = dateToString(date)

    // assert
    expect(result).toBe('2024-01-05')
  })

  it('formats a two-digit month and day', () => {
    // arrange
    const date = new Date(2024, 11, 31)

    // act
    const result = dateToString(date)

    // assert
    expect(result).toBe('2024-12-31')
  })
})
