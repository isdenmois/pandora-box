import { randomUUID } from 'node:crypto'
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
}
