import { eq } from 'drizzle-orm'
import { table } from '@/domain'
import { sleep } from '@/shared'
import { db } from '../db'
import { movieRepository } from './movie.repository'
import { searchRepository } from './search-repository'
import { seriesRepository } from './series.repository'

interface MovieImport {
  extId: string
  reason?: string
  private?: boolean
  userId?: string
}
interface SeriesImport {
  extId: string
  reason?: string
  season?: number
  private?: boolean
  userId?: string
}
interface ImportData {
  movies: MovieImport[]
  series: SeriesImport[]
}

/**
 * Import is an admin-only migration tool. New rows belong to the importer; an existing row keeps
 * its creator so a re-import never steals ownership. The old `userId` field is ignored because
 * ids from another installation do not map to this one.
 */
const importSeries = async (importerId: string, item: SeriesImport) => {
  const found = await db.query.series.findFirst({
    where: () => eq(table.series.extId, item.extId),
  })

  const isPrivate = item.private ?? found?.private ?? false

  if (found) {
    return await db
      .update(table.series)
      .set({
        reason: item.reason || found.reason,
        season: item.season ?? found.season,
        private: isPrivate,
      })
      .where(eq(table.series.id, found.id))
  }

  const series = await searchRepository.getById('omdb', item.extId)

  await sleep(5)

  if (!series) {
    return
  }

  await seriesRepository.create(
    {
      extId: item.extId,
      provider: 'omdb',
      title: series.title,
      poster: series.poster || null,
      year: series.year || null,
      season: item.season || 1,
      rating: series.rating || null,
      language: series.language || null,
      genre: series.genre || null,
      reason: item.reason || null,
      recommendedBy: null,
      private: isPrivate,
      scheduled: null,
      tags: null,
      extra: series.extra ?? {},
    },
    importerId,
  )
}

const importMovie = async (importerId: string, item: MovieImport) => {
  const found = await db.query.movie.findFirst({
    where: () => eq(table.movie.extId, item.extId),
  })

  const isPrivate = item.private ?? found?.private ?? false

  if (found) {
    return await db
      .update(table.movie)
      .set({
        reason: item.reason || found.reason,
        private: isPrivate,
      })
      .where(eq(table.movie.id, found.id))
  }

  const movie = await searchRepository.getById('omdb', item.extId)

  await sleep(5)

  if (!movie) {
    return
  }

  await movieRepository.create(
    {
      extId: item.extId,
      provider: 'omdb',
      title: movie.title,
      poster: movie.poster || null,
      year: movie.year || null,
      rating: movie.rating || null,
      language: movie.language || null,
      genre: movie.genre || null,
      reason: item.reason || null,
      recommendedBy: null,
      private: isPrivate,
      scheduled: null,
      tags: null,
      extra: movie.extra ?? {},
    },
    importerId,
  )
}

const status = {
  inProgress: false,
  movies: {
    finished: 0,
    total: 0,
  },
  series: {
    finished: 0,
    total: 0,
  },
}

export const importRepository = {
  async import(importerId: string, data: ImportData) {
    if (status.inProgress) {
      return { ok: true }
    }

    const { movies, series } = data

    status.inProgress = true
    status.movies = {
      finished: 0,
      total: movies.length,
    }
    status.series = {
      finished: 0,
      total: series.length,
    }

    for (const item of movies) {
      try {
        await importMovie(importerId, item)
      } catch (e) {
        console.log(e)
      } finally {
        status.movies.finished++
      }
    }

    for (const item of series) {
      try {
        await importSeries(importerId, item)
      } catch (e) {
        console.log(e)
      } finally {
        status.series.finished++
      }
    }

    status.inProgress = false

    return { ok: true }
  },

  status() {
    return status
  },
}
