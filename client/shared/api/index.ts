import { admin } from './admin-api'
import { auth } from './auth-api'
import { movie, type Movie, type MovieCreate } from './movie-api'
import { search, type SearchItem, type SearchItemDetails } from './search-api'
import { series, type Series, type SeriesCreate } from './series-api'
import { user, type User } from './user-api'

export type { Movie, MovieCreate, SearchItem, SearchItemDetails, Series, SeriesCreate, User }

export const api = {
  auth,
  admin,
  movie,
  search,
  series,
  user,
}
