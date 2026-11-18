import { randomUUID } from 'node:crypto'
import { eq, or } from 'drizzle-orm'
import { type Movie, type MovieCreate, type MovieUpdate, table } from '@/domain'
import { db } from '../db'
import { posterRepository } from './poster.instance'
import { posterFieldsFor } from './poster-fields'
import { recordUpdateFor } from './record-update'

export const movieRepository = {
  async create(data: MovieCreate, creatorId: string): Promise<Movie> {
    const id = randomUUID()
    const poster = posterFieldsFor(id, data.poster)
    const values = { ...data, ...poster, id, createdBy: creatorId }

    await db.insert(table.movie).values(values)

    return { ...values, seen: null, seenRating: null, seenComment: null }
  },

  async getAll(userId: string): Promise<Movie[]> {
    return await db
      .select()
      .from(table.movie)
      .where(or(eq(table.movie.createdBy, userId), eq(table.movie.private, false)))
  },

  /** Every shared row, regardless of creator; the admin attribution page uses this. */
  async getGlobal(): Promise<Movie[]> {
    return await db.select().from(table.movie).where(eq(table.movie.private, false))
  },

  async byId(id: string): Promise<Movie | null> {
    const movie = await db.query.movie.findFirst({
      where: eq(table.movie.id, id),
    })

    return movie || null
  },

  /** Every id, regardless of owner or visibility; used to tell orphans from live files. */
  async allIds(): Promise<string[]> {
    const rows = await db.select({ id: table.movie.id }).from(table.movie)

    return rows.map((row) => row.id)
  },

  async delete(id: string) {
    await db.delete(table.movie).where(eq(table.movie.id, id))
    await posterRepository.remove(id)
  },

  /** Rewrites only the stored path, used when the downloader corrects the file extension. */
  async setPosterPath(id: string, path: string) {
    await db.update(table.movie).set({ poster: path }).where(eq(table.movie.id, id))
  },

  async update(id: string, data: Partial<MovieUpdate>, filePoster?: string, editorId?: string): Promise<Movie | null> {
    // Claiming needs the stored visibility; poster changes already need the stored source.
    const stored = data.private === true || data.poster !== undefined ? await this.byId(id) : null
    const { values, removeFile } = recordUpdateFor(id, data, stored, filePoster, editorId)

    if (removeFile) {
      // The source changed, so the bytes on disk are stale; the next render downloads again.
      await posterRepository.remove(id)
    }

    // A poster replay produces no values at all; Drizzle rejects an empty `set`.
    if (Object.keys(values).length) {
      await db.update(table.movie).set(values).where(eq(table.movie.id, id))
    }

    return await this.byId(id)
  },

  async getViews(userId: string) {
    return await db.select().from(table.movieView).where(eq(table.movieView.userId, userId))
  },

  async markAsViewed(movieId: string, userId: string, date: string, rating: number, comment: string) {
    const id = randomUUID()
    const data = {
      id,
      movieId,
      userId,
      date,
      rating,
    }

    await db.insert(table.movieView).values(data)
    await db
      .update(table.movie)
      .set({ seen: date, seenRating: rating, seenComment: comment })
      .where(eq(table.movie.id, movieId))

    return data
  },

  async removeMovieView(movieId: string) {
    await db.delete(table.movieView).where(eq(table.movieView.movieId, movieId))
    await db.update(table.movie).set({ seen: null }).where(eq(table.movie.id, movieId))
  },
}
