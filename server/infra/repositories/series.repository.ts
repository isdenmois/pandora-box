import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { table, Series, SeriesCreate, SeriesUpdate } from '@/domain'
import { db } from '../db'

export const seriesRepository = {
  async create(data: SeriesCreate): Promise<Series> {
    const id = randomUUID()

    await db.insert(table.series).values({ ...data, id })

    return { ...data, id, seen: null }
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

  async getViews(userId: string) {
    return await db.select().from(table.seriesView).where(eq(table.seriesView.userId, userId))
  },

  async markAsViewed(seriesId: string, userId: string, date: string, rating: number) {
    const id = randomUUID()
    const data = {
      id,
      seriesId,
      userId,
      date,
      rating,
    }

    await db.insert(table.seriesView).values(data)
    await db.update(table.series).set({ seen: date }).where(eq(table.series.id, seriesId))

    return data
  },

  async removeView(viewId: string) {
    const view = await db.query.seriesView.findFirst({
      where: eq(table.seriesView.id, viewId),
    })

    if (view) {
      await db.delete(table.seriesView).where(eq(table.seriesView.id, viewId))
      await db.update(table.series).set({ seen: null }).where(eq(table.series.id, view.seriesId))
    }
  },

  async removeSeriesView(seriesId: string) {
    await db.delete(table.seriesView).where(eq(table.seriesView.seriesId, seriesId))
    await db.update(table.series).set({ seen: null }).where(eq(table.series.id, seriesId))
  },
}
