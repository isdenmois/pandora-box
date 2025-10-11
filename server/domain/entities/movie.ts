import { sqliteTable, text, blob, integer, real } from 'drizzle-orm/sqlite-core'

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
  userId: text('user_id'),
  private: integer({ mode: 'boolean' }),
  extra: blob({ mode: 'json' }),
})

export type Movie = typeof movie.$inferSelect

export type MovieCreate = Omit<Movie, 'id'>
export type MovieUpdate = Pick<Movie, 'title' | 'poster' | 'year' | 'rating' | 'reason' | 'private'>
