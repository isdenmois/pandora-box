import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { table, Movie } from '@/domain'
import { db } from '../db'

type CreateMovie = Omit<Movie, 'id'>

export const movieRepository = {
  async create(data: CreateMovie): Promise<Movie> {
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
}
