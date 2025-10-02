import { admin } from './admin-api'
import { auth } from './auth-api'
import { search, type SearchItem, type SearchItemDetails } from './search-api'
import { user, type User } from './user-api'

export type { SearchItem, SearchItemDetails, User }

export const api = {
  auth,
  admin,
  search,
  user,
}
