import type { Movie } from './movie.fixtures'

/** A record whose poster is already local, as the API returns it after a download. */
export const posterMovie = {
  id: '1',
  extId: 'tt123',
  provider: 'omdb',
  title: 'Poster Movie',
  poster: '/images/movie-1.jpg',
  posterSource: 'https://cdn.example.com/poster.jpg',
  year: 2020,
  rating: 7.5,
  language: 'English',
  genre: 'Drama',
  reason: null,
  createdBy: 'user-1',
  recommendedBy: null,
  private: false,
  scheduled: null,
  tags: null,
  extra: {},
  seen: null,
  seenRating: null,
  seenComment: null,
} as Movie
