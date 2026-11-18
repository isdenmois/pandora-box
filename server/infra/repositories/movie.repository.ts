import { randomUUID } from 'node:crypto'
import { eq, isNull, or } from 'drizzle-orm'
import { type Movie, type MovieCreate, type MovieUpdate, table } from '@/domain'
import { db } from '../db'
import { posterRepository } from './poster.instance'
import { posterFieldsFor, posterUpdateFor } from './poster-fields'

export const movieRepository = {
  async create(data: MovieCreate): Promise<Movie> {
    const id = randomUUID()
    const poster = posterFieldsFor(id, data.poster)
    const values = { ...data, ...poster, id }

    await db.insert(table.movie).values(values)

    return { ...values, seen: null, seenRating: null, seenComment: null }
  },

  async getAll(userId: string): Promise<Movie[]> {
    return await db
      .select()
      .from(table.movie)
      .where(or(eq(table.movie.userId, userId), isNull(table.movie.userId), eq(table.movie.private, false)))
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

  async update(id: string, data: Partial<MovieUpdate>, filePoster?: string): Promise<Movie | null> {
    const { poster: posterInput, ...rest } = data
    const next: Record<string, unknown> = { ...rest }

    if (filePoster) {
      // An uploaded file owns the only copy, so there is no source to download it from again.
      next.poster = filePoster
      next.posterSource = null
    } else if (posterInput !== undefined) {
      const stored = await this.byId(id)

      if (stored) {
        const { fields, removeFile } = posterUpdateFor(id, posterInput, stored)

        if (fields) {
          Object.assign(next, fields)
        }

        if (removeFile) {
          // The source changed, so the bytes on disk are stale; the next render downloads again.
          await posterRepository.remove(id)
        }
      }
    }

    // A poster replay produces no fields at all; Drizzle rejects an empty `set`.
    if (Object.keys(next).length) {
      await db.update(table.movie).set(next).where(eq(table.movie.id, id))
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

  async removeView(viewId: string) {
    const view = await db.query.movieView.findFirst({
      where: eq(table.movieView.id, viewId),
    })

    if (view) {
      await db.delete(table.movieView).where(eq(table.movieView.id, viewId))
      await db.update(table.movie).set({ seen: null }).where(eq(table.movie.id, view.movieId))
    }
  },

  async removeMovieView(movieId: string) {
    await db.delete(table.movieView).where(eq(table.movieView.movieId, movieId))
    await db.update(table.movie).set({ seen: null }).where(eq(table.movie.id, movieId))
  },
}
