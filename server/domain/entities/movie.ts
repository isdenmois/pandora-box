import { blob, index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { user } from './user'

export const movie = sqliteTable(
  'movie',
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
  (table) => [index('movie_user_id_idx').on(table.userId, table.private)],
)

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

/** Create payload: `poster` is the source URL, mapped to `posterSource` by the repository. */
export type MovieCreate = Omit<Movie, 'id' | 'seen' | 'seenRating' | 'seenComment' | 'poster' | 'posterSource'> & {
  poster: string | null
}
export type MovieUpdate = Pick<
  Movie,
  'title' | 'year' | 'rating' | 'reason' | 'userId' | 'private' | 'scheduled' | 'tags'
> & {
  poster?: string | null
}
