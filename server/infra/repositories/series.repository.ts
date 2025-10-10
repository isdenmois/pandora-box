import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { table, Series } from '@/domain'
import { db } from '../db'

type CreateSeries = Omit<Series, 'id'>

export const seriesRepository = {
  async create(data: CreateSeries): Promise<Series> {
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
}
