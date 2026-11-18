import { and, eq, inArray } from 'drizzle-orm'
import { table } from '@/domain'
import { db } from '../db'
import { movieRepository } from './movie.repository'
import { seriesRepository } from './series.repository'

export interface AttributionReassign {
  movies: string[]
  series: string[]
  createdBy: string
}

export type AttributionResult = { ok: true; updated: number } | { ok: false; reason: 'unavailable' }

const unique = (ids: string[]) => [...new Set(ids)]

/**
 * Reassigns only global rows. A private row belongs to its creator alone, so the admin page can
 * never reach one; a row that became private between load and save makes the whole batch fail
 * rather than apply partially.
 */
export const attributionRepository = {
  async getGlobal() {
    const [movies, series] = await Promise.all([movieRepository.getGlobal(), seriesRepository.getGlobal()])

    return { movies, series }
  },

  async reassign({ movies, series, createdBy }: AttributionReassign): Promise<AttributionResult> {
    const movieIds = unique(movies)
    const seriesIds = unique(series)

    return await db.transaction(async (tx) => {
      const movieRows = movieIds.length
        ? await tx
            .select({ id: table.movie.id, private: table.movie.private })
            .from(table.movie)
            .where(inArray(table.movie.id, movieIds))
        : []
      const seriesRows = seriesIds.length
        ? await tx
            .select({ id: table.series.id, private: table.series.private })
            .from(table.series)
            .where(inArray(table.series.id, seriesIds))
        : []

      if (
        movieRows.length !== movieIds.length ||
        seriesRows.length !== seriesIds.length ||
        movieRows.some((row) => row.private) ||
        seriesRows.some((row) => row.private)
      ) {
        return { ok: false as const, reason: 'unavailable' as const }
      }

      if (movieIds.length) {
        // A user cannot recommend a row they created themselves; drop the stale credit.
        await tx
          .update(table.movie)
          .set({ recommendedBy: null })
          .where(and(inArray(table.movie.id, movieIds), eq(table.movie.recommendedBy, createdBy)))
        await tx.update(table.movie).set({ createdBy }).where(inArray(table.movie.id, movieIds))
      }

      if (seriesIds.length) {
        await tx
          .update(table.series)
          .set({ recommendedBy: null })
          .where(and(inArray(table.series.id, seriesIds), eq(table.series.recommendedBy, createdBy)))
        await tx.update(table.series).set({ createdBy }).where(inArray(table.series.id, seriesIds))
      }

      return { ok: true as const, updated: movieIds.length + seriesIds.length }
    })
  },
}
