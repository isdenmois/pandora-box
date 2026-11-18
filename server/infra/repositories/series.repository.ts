import { randomUUID } from 'node:crypto'
import { eq, or } from 'drizzle-orm'
import { type Series, type SeriesCreate, type SeriesUpdate, table } from '@/domain'
import { db } from '../db'
import { posterRepository } from './poster.instance'
import { posterFieldsFor } from './poster-fields'
import { recordUpdateFor } from './record-update'

export const seriesRepository = {
  async create(data: SeriesCreate, creatorId: string): Promise<Series> {
    const id = randomUUID()
    const poster = posterFieldsFor(id, data.poster)
    const values = { ...data, ...poster, id, createdBy: creatorId }

    await db.insert(table.series).values(values)

    return { ...values, seasonHistory: null, seen: null, seenRating: null, seenComment: null }
  },

  async getAll(userId: string): Promise<Series[]> {
    return await db
      .select()
      .from(table.series)
      .where(or(eq(table.series.createdBy, userId), eq(table.series.private, false)))
  },

  /** Every shared row, regardless of creator; the admin attribution page uses this. */
  async getGlobal(): Promise<Series[]> {
    return await db.select().from(table.series).where(eq(table.series.private, false))
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

  async update(
    id: string,
    data: Partial<SeriesUpdate>,
    filePoster?: string,
    editorId?: string,
  ): Promise<Series | null> {
    // Claiming needs the stored visibility; poster changes already need the stored source.
    const stored = data.private === true || data.poster !== undefined ? await this.byId(id) : null
    const { values, removeFile } = recordUpdateFor(id, data, stored, filePoster, editorId)

    if (removeFile) {
      // The source changed, so the bytes on disk are stale; the next render downloads again.
      await posterRepository.remove(id)
    }

    // A poster replay produces no values at all; Drizzle rejects an empty `set`.
    if (Object.keys(values).length) {
      await db.update(table.series).set(values).where(eq(table.series.id, id))
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

  async removeSeriesView(seriesId: string) {
    await db.delete(table.seriesView).where(eq(table.seriesView.seriesId, seriesId))
    await db.update(table.series).set({ seen: null }).where(eq(table.series.id, seriesId))
  },
}
