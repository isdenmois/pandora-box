import { defineStore } from 'pinia'
import { computed, readonly, ref } from 'vue'
import { useMovies } from '@/entities/movie'
import { useSeries } from '@/entities/series'
import type { Movie, Series } from '@/shared/api'
import { compare } from '@/shared/lib'

const byRating = compare<Movie | Series>((m) => -(m.rating || 0))
const byTitle = compare<Movie | Series>((m) => m.title)

const sorts = {
  title: byTitle,
  rating: byRating,
}

type Sort = keyof typeof sorts

export const useHome = defineStore('home', () => {
  const movies = useMovies()
  const series = useSeries()

  const forMe = ref(false)
  const sort = ref<Sort>('rating')

  const filter = (item: Movie | Series) => {
    return forMe.value === !!item.private
  }

  return {
    forMe: readonly(forMe),
    sort: readonly(sort),
    movies: computed(() => movies.all.filter(filter).sort(sorts[sort.value])),
    series: computed(() => series.all.filter(filter).sort(sorts[sort.value])),
    toggleForMe() {
      forMe.value = !forMe.value
    },
    toggleSort() {
      sort.value = sort.value === 'rating' ? 'title' : 'rating'
    },
  }
})
