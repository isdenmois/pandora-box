import { admin } from './admin-api'
import { auth } from './auth-api'
import { movie } from './movie-api'
import { search, type SearchItem, type SearchItemDetails } from './search-api'
import { series } from './series-api'
import { user, type User } from './user-api'

export type { SearchItem, SearchItemDetails, User }

export type * from './movie-api'
export type * from './series-api'

export const api = {
  auth,
  admin,
  movie,
  search,
  series,
  user,
}
