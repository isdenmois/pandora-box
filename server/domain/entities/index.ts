import { session } from './session'
import { user } from './user'

export { type Session } from './session'
export { type User } from './user'

export const table = { session, user }
export const schema = table
