import { movie, movieView } from './movie'
import { series, seriesView } from './series'
import { session } from './session'
import { user } from './user'

export type * from './movie'
export type * from './series'
export type * from './session'
export type * from './user'

export const table = { movie, movieView, series, seriesView, session, user }
export const toBackup = { movie, movieView, series, seriesView, user }
export const schema = table
