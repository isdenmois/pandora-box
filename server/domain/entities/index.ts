import { movie } from './movie'
import { series } from './series'
import { session } from './session'
import { user } from './user'

export { type Movie } from './movie'
export { type Series } from './series'
export { type Session } from './session'
export { type User } from './user'

export const table = { movie, series, session, user }
export const toBackup = { movie, series, user }
export const schema = table
