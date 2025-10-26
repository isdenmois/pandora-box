import { sqliteTable, text, integer, blob, real, index } from 'drizzle-orm/sqlite-core'
import { user } from './user'

export const series = sqliteTable(
  'series',
  {
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
    seen: text(),
    seenRating: integer(),
    userId: text('user_id'),
    private: integer({ mode: 'boolean' }),
    extra: blob({ mode: 'json' }),
  },
  (table) => [index('series_user_id_idx').on(table.userId, table.private)],
)

export const seriesView = sqliteTable('series_view', {
  id: text().primaryKey(),
  seriesId: text('series_id')
    .references(() => series.id, { onDelete: 'cascade' })
    .notNull(),
  userId: text('user_id')
    .references(() => user.id, { onDelete: 'cascade' })
    .notNull(),
  date: text().notNull(),
  rating: integer().notNull(),
})

export type Series = typeof series.$inferSelect
export type SeriesView = typeof series.$inferSelect

export type SeriesCreate = Omit<Series, 'id' | 'seen' | 'seenRating'>
export type SeriesUpdate = Pick<
  Series,
  'title' | 'poster' | 'season' | 'year' | 'rating' | 'reason' | 'userId' | 'private'
>
