import type { SearchItem, SearchItemDetails } from '../../client/shared/api'

export type { SearchItem, SearchItemDetails }

const series: SearchItem = {
  id: 'tt1',
  title: 'Black Mirror',
  type: 'series',
  poster: null,
  year: 2020,
}

const movie: SearchItem = {
  id: 'tt2',
  title: 'Black Magic',
  type: 'movie',
  poster: null,
  year: 1980,
}

export const searchFixture = {
  series,
  movie,
  details: {
    series: {
      ...series,
    } as SearchItemDetails,
    movie: {
      ...movie,
    } as SearchItemDetails,
  },
}
