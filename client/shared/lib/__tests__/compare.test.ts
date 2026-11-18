import { describe, expect, it } from 'vitest'
import { compare } from '../compare'

interface Row {
  rating: number
  title: string
  year: number
}

const row = (overrides: Partial<Row>): Row => ({ rating: 0, title: 'a', year: 2000, ...overrides })

describe('compare', () => {
  it('orders rows by the selected key', () => {
    // arrange
    const byRating = compare((item: Row) => item.rating)
    const low = row({ rating: 1 })
    const high = row({ rating: 2 })

    // act
    const results = [byRating(low, high), byRating(high, low)]

    // assert
    expect(results).toEqual([-1, 1])
  })

  it('returns zero for rows with the same key', () => {
    // arrange
    const byRating = compare((item: Row) => item.rating)
    const left = row({ rating: 5, title: 'left' })
    const right = row({ rating: 5, title: 'right' })

    // act
    const result = byRating(left, right)

    // assert
    expect(result).toBe(0)
  })

  it('breaks ties with the fallback key', () => {
    // arrange
    const byRatingThenTitle = compare(
      (item: Row) => item.rating,
      (item: Row) => item.title,
    )
    const alpha = row({ rating: 5, title: 'Alpha' })
    const beta = row({ rating: 5, title: 'Beta' })

    // act
    const results = [byRatingThenTitle(alpha, beta), byRatingThenTitle(beta, alpha)]

    // assert
    expect(results).toEqual([-1, 1])
  })

  it('breaks a two-key tie with the third key', () => {
    // arrange
    const byYearThenRatingThenTitle = compare(
      (item: Row) => item.year,
      (item: Row) => item.rating,
      (item: Row) => item.title,
    )
    const alpha = row({ year: 2000, rating: 5, title: 'Alpha' })
    const beta = row({ year: 2000, rating: 5, title: 'Beta' })

    // act
    const result = byYearThenRatingThenTitle(alpha, beta)

    // assert
    expect(result).toBe(-1)
  })

  it('inverts the order when ascending is negative', () => {
    // arrange
    const descending = compare((item: Row) => item.rating, null, null, -1)
    const low = row({ rating: 1 })
    const high = row({ rating: 2 })

    // act
    const results = [descending(low, high), descending(high, low)]

    // assert
    expect(results).toEqual([1, -1])
  })

  it('sorts string keys alphabetically', () => {
    // arrange
    const byTitle = compare((item: Row) => item.title)
    const alpha = row({ title: 'Alpha' })
    const beta = row({ title: 'Beta' })

    // act
    const result = byTitle(alpha, beta)

    // assert
    expect(result).toBe(-1)
  })
})
