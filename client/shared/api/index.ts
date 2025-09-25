import { admin } from './admin-api'
import { auth } from './auth-api'
import { search, type SearchItem } from './search-api'
import { user, type User } from './user-api'

export type { SearchItem, User }

export const api = {
  auth,
  admin,
  search,
  user,
}
