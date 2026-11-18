import { describe, expect, it } from 'vitest'
import { formatDate } from '../format-date'

describe('formatDate', () => {
  it('formats a timestamp as a russian day.month.year date', () => {
    // arrange
    // Local-time construction keeps the assertion timezone-independent.
    const timestamp = new Date(2025, 9, 24).getTime()

    // act
    const result = formatDate(timestamp)

    // assert
    expect(result).toBe('24.10.2025')
  })

  it('zero-pads single-digit days and months', () => {
    // arrange
    const timestamp = new Date(2024, 0, 5).getTime()

    // act
    const result = formatDate(timestamp)

    // assert
    expect(result).toBe('05.01.2024')
  })

  it('renders an invalid date as an invalid-date label instead of throwing', () => {
    // arrange
    // act
    const result = formatDate('not-a-date')

    // assert
    expect(result).toContain('Invalid')
  })
})
