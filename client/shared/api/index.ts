import { admin } from './admin-api'
import { auth } from './auth-api'
import { movie } from './movie-api'
import { type SearchItem, type SearchItemDetails, search } from './search-api'
import { series } from './series-api'
import { type User, user } from './user-api'

export type * from './admin-api'
export type * from './movie-api'
export type * from './series-api'
export type { SearchItem, SearchItemDetails, User }

export const api = {
  auth,
  admin,
  movie,
  search,
  series,
  user,
}
