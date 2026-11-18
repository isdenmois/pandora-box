import { blob, index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { user } from './user'

export const series = sqliteTable(
  'series',
  {
    id: text().primaryKey(),
    extId: text('ext_id'),
    provider: text(),
    title: text().notNull(),
    /** Same-origin path served by nginx, e.g. `/images/<id>.jpg`. */
    poster: text(),
    /** Remote origin the local file is downloaded from; kept for retry and fallback. */
    posterSource: text('poster_source'),
    year: integer(),
    season: integer(),
    seasonHistory: blob({ mode: 'json' }).$type<Record<string, string>>(),
    rating: real(),
    language: text(),
    genre: text(),
    reason: text(),
    seen: text(),
    seenRating: integer(),
    seenComment: text(),
    userId: text('user_id'),
    private: integer({ mode: 'boolean' }),
    scheduled: integer({ mode: 'number' }),
    tags: blob({ mode: 'json' }).$type<string[]>(),
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

/** Create payload: `poster` is the source URL, mapped to `posterSource` by the repository. */
export type SeriesCreate = Omit<
  Series,
  'id' | 'seasonHistory' | 'seen' | 'seenRating' | 'seenComment' | 'poster' | 'posterSource'
> & {
  poster: string | null
}
export type SeriesUpdate = Pick<
  Series,
  'title' | 'season' | 'seasonHistory' | 'year' | 'rating' | 'reason' | 'userId' | 'private'
> & {
  poster?: string | null
}
