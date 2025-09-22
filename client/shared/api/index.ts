import { admin } from './admin-api'
import { auth } from './auth-api'
import { user, type User } from './user-api'

export type { User }

export const api = {
  auth,
  admin,
  user,
}
