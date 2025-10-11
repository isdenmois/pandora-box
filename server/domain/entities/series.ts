import { sqliteTable, text, integer, blob, real } from 'drizzle-orm/sqlite-core'

export const series = sqliteTable('series', {
  id: text().primaryKey(),
  extId: text('ext_id'),
  provider: text(),
  title: text().notNull(),
  poster: text(),
  year: integer(),
  season: integer(),
  rating: real(),
  language: text(),
  genre: text(),
  reason: text(),
  userId: text('user_id'),
  private: integer({ mode: 'boolean' }),
  extra: blob({ mode: 'json' }),
})

export type Series = typeof series.$inferSelect

export type SeriesCreate = Omit<Series, 'id'>
export type SeriesUpdate = Pick<Series, 'title'>
