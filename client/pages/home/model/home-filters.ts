import { defineStore } from 'pinia'
import { computed, readonly, ref } from 'vue'
import { useMovies } from '@/entities/movie'
import { useSeries } from '@/entities/series'
import type { Movie, Series } from '@/shared/api'
import { compare } from '@/shared/lib'

const byRating = compare<Movie | Series>((m) => -(m.rating || 0))
const bySeason = compare<Movie | Series>(
  (m) => -(('season' in m && m.season) || 0),
  (m) => -(m.rating || 0),
)
const byTitle = compare<Movie | Series>((m) => m.title)
const bySchedule = compare<Movie | Series>((m) =>
  m.scheduled && m.scheduled! > 0 ? m.scheduled : Number.MAX_SAFE_INTEGER,
)
const bySeen = compare<Movie | Series>((m) => m.seen || '', null, -1)

const sorts = {
  season: bySeason,
  title: byTitle,
  rating: byRating,
}

type Sort = keyof typeof sorts

export const useHome = defineStore('home', () => {
  const movies = useMovies()
  const series = useSeries()

  const forMe = ref(false)
  const sort = ref<Sort>('season')
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
  const sortBy = computed(() => (seen.value ? bySeen : sorts[sort.value]))

  return {
    forMe: readonly(forMe),
    sort: readonly(sort),
    seen: readonly(seen),
    search,
    movies: computed(() => movies.all.filter(filter).sort(sortBy.value)),
    series: computed(() => series.all.filter(filter).sort(sortBy.value)),
    scheduled: computed(() =>
      (movies.all as Array<Movie | Series>).concat(series.all).filter(filterScheduled).sort(bySchedule),
    ),
    toggleForMe() {
      forMe.value = !forMe.value
    },
    toggleSort() {
      if (sort.value === 'season') {
        sort.value = 'title'
      } else if (sort.value === 'title') {
        sort.value = 'rating'
      } else {
        sort.value = 'season'
      }
    },
    toggleSeen() {
      seen.value = !seen.value
    },
  }
})
