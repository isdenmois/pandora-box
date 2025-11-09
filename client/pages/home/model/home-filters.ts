import { defineStore } from 'pinia'
import { computed, readonly, ref } from 'vue'
import { useMovies } from '@/entities/movie'
import { useSeries } from '@/entities/series'
import type { Movie, Series } from '@/shared/api'
import { compare } from '@/shared/lib'

const byRating = compare<Movie | Series>((m) => -(m.rating || 0))
const byTitle = compare<Movie | Series>((m) => m.title)
const bySchedule = compare<Movie | Series>((m) =>
  m.scheduled && m.scheduled! > 0 ? m.scheduled : Number.MAX_SAFE_INTEGER,
)

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
  const seen = ref(false)
  const search = ref('')
  const searchValue = computed(() => search.value.trim().toLowerCase())
  const now = Date.now()

  const filterByFilters = (item: Movie | Series) => {
    return forMe.value === !!item.private && seen.value === !!item.seen
  }
  const filterBySearch = (item: Movie | Series) => {
    if (searchValue.value) {
      return item.title.toLowerCase().includes(searchValue.value)
    }

    return true
  }
  const filterBySchedule = (item: Movie | Series) => {
    return item.scheduled === null || (item.scheduled > 0 && item.scheduled < now)
  }

  const filter = (item: Movie | Series) => {
    return filterByFilters(item) && filterBySearch(item) && filterBySchedule(item)
  }
  const filterScheduled = (item: Movie | Series) => {
    return filterByFilters(item) && filterBySearch(item) && !filterBySchedule(item)
  }

  return {
    forMe: readonly(forMe),
    sort: readonly(sort),
    seen: readonly(seen),
    search,
    movies: computed(() => movies.all.filter(filter).sort(sorts[sort.value])),
    series: computed(() => series.all.filter(filter).sort(sorts[sort.value])),
    scheduled: computed(() =>
      (movies.all as Array<Movie | Series>).concat(series.all).filter(filterScheduled).sort(bySchedule),
    ),
    toggleForMe() {
      forMe.value = !forMe.value
    },
    toggleSort() {
      sort.value = sort.value === 'rating' ? 'title' : 'rating'
    },
    toggleSeen() {
      seen.value = !seen.value
    },
  }
})
