import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { table, Movie, MovieUpdate, MovieCreate } from '@/domain'
import { db } from '../db'

export const movieRepository = {
  async create(data: MovieCreate): Promise<Movie> {
    const id = randomUUID()

    await db.insert(table.movie).values({ ...data, id })

    return { ...data, id }
  },
  async getAll(): Promise<Movie[]> {
    return await db.select().from(table.movie)
  },

  async byId(id: string): Promise<Movie | null> {
    const movie = await db.query.movie.findFirst({
      where: eq(table.movie.id, id),
    })

    return movie || null
  },

  async update(id: string, data: MovieUpdate) {
    await db.update(table.movie).set(data).where(eq(table.movie.id, id))
  },
}
