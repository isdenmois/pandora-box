import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { table, Series, SeriesCreate, SeriesUpdate } from '@/domain'
import { db } from '../db'

export const seriesRepository = {
  async create(data: SeriesCreate): Promise<Series> {
    const id = randomUUID()

    await db.insert(table.series).values({ ...data, id })

    return { ...data, id }
  },
  async getAll(): Promise<Series[]> {
    return await db.select().from(table.series)
  },

  async byId(id: string): Promise<Series | null> {
    const series = await db.query.series.findFirst({
      where: eq(table.series.id, id),
    })

    return series || null
  },

  async update(id: string, data: SeriesUpdate) {
    await db.update(table.series).set(data).where(eq(table.series.id, id))
  },
}
