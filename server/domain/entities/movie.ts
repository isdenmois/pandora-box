import { sqliteTable, text, blob, integer, real } from 'drizzle-orm/sqlite-core'
import { user } from './user'

export const movie = sqliteTable('movie', {
  id: text().primaryKey(),
  extId: text('ext_id'),
  provider: text(),
  title: text().notNull(),
  poster: text(),
  year: integer(),
  rating: real(),
  language: text(),
  genre: text(),
  reason: text(),
  seen: text(),
  userId: text('user_id'),
  private: integer({ mode: 'boolean' }),
  extra: blob({ mode: 'json' }),
})

export const movieView = sqliteTable('movie_view', {
  id: text().primaryKey(),
  movieId: text('movie_id')
    .references(() => movie.id, { onDelete: 'cascade' })
    .notNull(),
  userId: text('user_id')
    .references(() => user.id, { onDelete: 'cascade' })
    .notNull(),
  date: text().notNull(),
  rating: integer().notNull(),
})

export type Movie = typeof movie.$inferSelect
export type MovieView = typeof movieView.$inferSelect

export type MovieCreate = Omit<Movie, 'id' | 'seen'>
export type MovieUpdate = Pick<Movie, 'title' | 'poster' | 'year' | 'rating' | 'reason' | 'private'>
