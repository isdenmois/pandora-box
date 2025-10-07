import { useMovies } from '@/entities/movie'
import { useSeries } from '@/entities/series'
import type { Movie, Series } from '@/shared/api'
import { defineStore } from 'pinia'
import { computed, readonly, ref } from 'vue'

export const useHome = defineStore('home', () => {
  const movies = useMovies()
  const series = useSeries()

  const forMe = ref(false)
  const filter = (item: Movie | Series) => {
    return forMe.value ? item.userId === 'me' : item.userId !== 'me'
  }

  return {
    forMe: readonly(forMe),
    movies: computed(() => movies.all.filter(filter)),
    series: computed(() => series.all.filter(filter)),
    toggleForMe() {
      forMe.value = !forMe.value
    },
  }
})
