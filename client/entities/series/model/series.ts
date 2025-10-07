import { computed, readonly, shallowRef } from 'vue'
import { defineStore } from 'pinia'
import { api, type Series, type SeriesCreate } from '@/shared/api'
import { compare } from '@/shared/lib'

const byRating = compare<Series>((s) => -(s.rating || 0))

export const useSeries = defineStore('series', () => {
  const all = shallowRef<Series[]>([])
  const isLoading = shallowRef(false)

  return {
    all: computed(() => all.value.sort(byRating)),
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
  }
})
