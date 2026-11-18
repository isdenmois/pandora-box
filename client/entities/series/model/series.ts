import { defineStore } from 'pinia'
import { readonly, ref, shallowRef } from 'vue'
import { api, type Series, type SeriesCreate, type SeriesUpdate } from '@/shared/api'
import { isOmdb, isOmdbString } from '@/shared/lib'

export const useSeries = defineStore('series', () => {
  const all = ref<Series[]>([])
  const isLoading = shallowRef(false)

  return {
    all: all,
    isLoading: readonly(isLoading),
    async refresh() {
      isLoading.value = true

      try {
        all.value = await api.series.getAll()
      } finally {
        isLoading.value = false
      }
    },
    async create(data: SeriesCreate) {
      const series = await api.series.create(data)

      all.value = [...all.value, series]
    },

    async byId(id: string) {
      const existed = all.value.find((item) => item.id === id)

      if (existed) {
        return existed
      }

      const item = await api.series.byId(id)

      all.value.push(item)

      return item
    },

    async delete(id: string) {
      all.value = all.value.filter((item) => item.id !== id)

      await api.series.delete(id)
    },

    async update(id: string, data: SeriesUpdate, file?: File | null) {
      const saved = file ? await api.series.savePoster(id, data, file) : await api.series.patch(id, data)
      const existed = all.value.find((item) => item.id === id)

      // The server owns `poster`/`posterSource`; taking its answer avoids showing a stale path.
      if (existed) {
        Object.assign(existed, saved)
      }
    },

    /** Drops the stored file; the next render downloads it again. */
    async redownloadPoster(id: string) {
      const saved = await api.poster.redownload(id)
      const existed = all.value.find((item) => item.id === id)

      if (existed) {
        Object.assign(existed, saved)
      }
    },

    async markAsViewed(id: string, date: string, rating: number, comment: string) {
      const existed = all.value.find((item) => item.id === id)

      if (existed) {
        Object.assign(existed, { seen: date, seenRating: rating, seenComment: comment })
      }

      await api.series.markAsViewed(id, date, rating, comment)
    },

    async removeSeriesView(id: string) {
      const existed = all.value.find((item) => item.id === id)

      if (existed) {
        existed.seen = null
      }

      await api.series.removeSeriesView(id)
    },

    async setSeason(id: string, season: number) {
      const existed = all.value.find((item) => item.id === id)
      let seasonHistory: Record<string, string> | undefined

      if (existed) {
        seasonHistory = Object.fromEntries(Object.entries(existed.seasonHistory || {}).filter(([s]) => +s < season))
        seasonHistory[existed.season || '1'] = new Date().toISOString().slice(0, 10)

        existed.season = season
        existed.seasonHistory = seasonHistory
      }

      await api.series.patch(id, { season, seasonHistory })
    },

    async refreshData(id: string) {
      const existed = all.value.find((item) => item.id === id)

      if (!existed?.extId || !isOmdb(existed)) {
        return
      }

      const data = await api.search.byId(existed.extId, 'omdb')
      const extra = { ...existed.extra }

      if (isOmdb(data)) {
        if (data.extra.Actors && isOmdbString(data.extra.Actors)) {
          extra.Actors = data.extra.Actors
        }
        if (data.extra.Runtime && isOmdbString(data.extra.Runtime)) {
          extra.Runtime = data.extra.Runtime
        }
        if (data.extra.totalSeasons && isOmdbString(data.extra.totalSeasons)) {
          extra.totalSeasons = data.extra.totalSeasons
        }
      }
      const toRefresh = {
        title: data.title || existed.title,
        rating: data.rating || existed.rating,
        year: data.year || existed.year,
        // A new remote URL invalidates the stored file; the server unlinks it and downloads again.
        poster: data.poster || existed.posterSource || existed.poster,
        genre: data.genre || existed.genre,
        extra,
      }

      const saved = await api.series.patch(id, toRefresh)

      Object.assign(existed, saved)
    },
  }
})
