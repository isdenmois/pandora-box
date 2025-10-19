import { defineStore } from 'pinia'
import { readonly, ref, shallowRef } from 'vue'
import { api, type Series, type SeriesCreate, type SeriesUpdate } from '@/shared/api'

export const useSeries = defineStore('series', () => {
  const all = ref<Series[]>([])
  const isLoading = shallowRef(false)

  return {
    all: readonly(all),
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

    async update(id: string, data: SeriesUpdate) {
      const existed = all.value.find((item) => item.id === id)

      if (existed) {
        Object.assign(existed, data)
      }

      await api.series.update(id, data)
    },

    async markAsViewed(id: string, date: string, rating: number) {
      const existed = all.value.find((item) => item.id === id)

      if (existed) {
        Object.assign(existed, { seen: date, seenRating: rating })
      }

      await api.series.markAsViewed(id, date, rating)
    },

    async removeSeriesView(id: string) {
      const existed = all.value.find((item) => item.id === id)

      if (existed) {
        Object.assign(existed, { seen: null })
      }

      await api.series.removeSeriesView(id)
    },
  }
})
