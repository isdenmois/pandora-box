import { describe, expect, it } from 'vitest'
import { getExternalUrl } from '../get-external-url'

describe('getExternalUrl', () => {
  it('links an omdb title when no season is given', () => {
    // arrange
    // act
    const result = getExternalUrl('omdb', 'tt123')

    // assert
    expect(result).toBe('https://www.imdb.com/title/tt123')
  })

  it('links the season episodes page for a series', () => {
    // arrange
    // act
    const result = getExternalUrl('omdb', 'tt123', 2)

    // assert
    expect(result).toBe('https://www.imdb.com/title/tt123/episodes/?season=2')
  })

  it('returns null for an unknown provider', () => {
    // arrange
    // act
    const result = getExternalUrl('manual', 'tt123')

    // assert
    expect(result).toBeNull()
  })

  it('falls back to the title link for season 0 and null', () => {
    // arrange
    // act
    const zero = getExternalUrl('omdb', 'tt123', 0)
    const empty = getExternalUrl('omdb', 'tt123', null)

    // assert
    expect(zero).toBe('https://www.imdb.com/title/tt123')
    expect(empty).toBe('https://www.imdb.com/title/tt123')
  })
})
