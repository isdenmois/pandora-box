import type { SearchItem, SearchItemDetails } from '@/shared/api'

export { makeMovie, makeSeries } from '@/shared/ui/__tests__/fixtures'

export const makeSearchItem = (overrides: Partial<SearchItem> = {}): SearchItem => ({
  id: 'tt123',
  title: 'Some Movie',
  type: 'movie',
  poster: 'http://localhost/poster.jpg',
  year: 2020,
  ...overrides,
})

export const makeSearchItemDetails = (overrides: Partial<SearchItemDetails> = {}): SearchItemDetails => ({
  id: 'tt123',
  provider: 'omdb',
  title: 'Some Movie',
  type: 'movie',
  year: 2020,
  poster: 'http://localhost/poster.jpg',
  rating: 7.5,
  genre: 'Drama',
  language: 'English',
  extra: {},
  ...overrides,
})
