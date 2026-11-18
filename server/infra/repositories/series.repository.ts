import { randomUUID } from 'node:crypto'
import { eq, isNull, or } from 'drizzle-orm'
import { type Series, type SeriesCreate, type SeriesUpdate, table } from '@/domain'
import { db } from '../db'
import { posterRepository } from './poster.instance'
import { posterFieldsFor, posterUpdateFor } from './poster-fields'

export const seriesRepository = {
  async create(data: SeriesCreate): Promise<Series> {
    const id = randomUUID()
    const poster = posterFieldsFor(id, data.poster)
    const values = { ...data, ...poster, id }

    await db.insert(table.series).values(values)

    return { ...values, seasonHistory: null, seen: null, seenRating: null, seenComment: null }
  },

  async getAll(userId: string): Promise<Series[]> {
    return await db
      .select()
      .from(table.series)
      .where(or(eq(table.series.userId, userId), isNull(table.series.userId), eq(table.series.private, false)))
  },

  async byId(id: string): Promise<Series | null> {
    const series = await db.query.series.findFirst({
      where: eq(table.series.id, id),
    })

    return series || null
  },

  /** Every id, regardless of owner or visibility; used to tell orphans from live files. */
  async allIds(): Promise<string[]> {
    const rows = await db.select({ id: table.series.id }).from(table.series)

    return rows.map((row) => row.id)
  },

  async delete(id: string) {
    await db.delete(table.series).where(eq(table.series.id, id))
    await posterRepository.remove(id)
  },

  /** Rewrites only the stored path, used when the downloader corrects the file extension. */
  async setPosterPath(id: string, path: string) {
    await db.update(table.series).set({ poster: path }).where(eq(table.series.id, id))
  },

  async update(id: string, data: Partial<SeriesUpdate>): Promise<Series | null> {
    const { poster: posterInput, ...rest } = data
    const next: Record<string, unknown> = { ...rest }

    if (posterInput !== undefined) {
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
      await db.update(table.series).set(next).where(eq(table.series.id, id))
    }

    return await this.byId(id)
  },

  async getViews(userId: string) {
    return await db.select().from(table.seriesView).where(eq(table.seriesView.userId, userId))
  },

  async markAsViewed(seriesId: string, userId: string, date: string, rating: number, comment: string) {
    const id = randomUUID()
    const data = {
      id,
      seriesId,
      userId,
      date,
      rating,
    }

    await db.insert(table.seriesView).values(data)
    await db
      .update(table.series)
      .set({ seen: date, seenRating: rating, seenComment: comment })
      .where(eq(table.series.id, seriesId))

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
