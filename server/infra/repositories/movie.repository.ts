import { randomUUID } from 'node:crypto'
import { eq, or, isNull } from 'drizzle-orm'
import { table, Movie, MovieUpdate, MovieCreate } from '@/domain'
import { db } from '../db'

export const movieRepository = {
  async create(data: MovieCreate): Promise<Movie> {
    const id = randomUUID()

    await db.insert(table.movie).values({ ...data, id })

    return { ...data, id, seen: null, seenRating: null }
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

  async delete(id: string) {
    await db.delete(table.movie).where(eq(table.movie.id, id))
  },

  async update(id: string, data: Partial<MovieUpdate>) {
    await db.update(table.movie).set(data).where(eq(table.movie.id, id))
  },

  async getViews(userId: string) {
    return await db.select().from(table.movieView).where(eq(table.movieView.userId, userId))
  },

  async markAsViewed(movieId: string, userId: string, date: string, rating: number) {
    const id = randomUUID()
    const data = {
      id,
      movieId,
      userId,
      date,
      rating,
    }

    await db.insert(table.movieView).values(data)
    await db.update(table.movie).set({ seen: date, seenRating: rating }).where(eq(table.movie.id, movieId))

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
