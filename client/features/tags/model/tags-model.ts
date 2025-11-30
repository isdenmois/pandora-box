import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useMovies } from '@/entities/movie'
import { useSeries } from '@/entities/series'

export const useTags = defineStore('tags', () => {
  const tags = computed(() =>
    [...new Set([...useSeries().all, ...useMovies().all].flatMap((i) => i.tags || []))].filter(Boolean).sort(),
  )

  return { tags }
})
