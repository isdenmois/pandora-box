import { defineStore } from 'pinia'
import { computed, readonly, ref } from 'vue'
import { useMovies } from '@/entities/movie'
import { useSeries } from '@/entities/series'
import type { Movie, Series } from '@/shared/api'
import { compare } from '@/shared/lib'

const byRating = compare<Movie | Series>((m) => -(m.rating || 0))
const bySeason = compare<Movie | Series>(
  (m) => (m.scheduled ? m.scheduled : Number.MAX_SAFE_INTEGER),
  (m) => ('season' in m && m.season ? -m.season : 0),
  (m) => -(m.rating || 0),
)
const byTitle = compare<Movie | Series>((m) => m.title)
const bySchedule = compare<Movie | Series>(
  (m) => (m.scheduled && m.scheduled > 0 ? m.scheduled : Number.MAX_SAFE_INTEGER),
  (m) => m.title,
)
const bySeen = compare<Movie | Series>((m) => m.seen || '', null, null, -1)

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
  const tag = ref<string | null>(null)
  // The creator-filter UI is hidden for now; the state stays wired so it can be shown again.
  const creator = ref<string | null>(null)
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
    return !item.scheduled || (item.scheduled > 0 && item.scheduled < now)
  }
  const filterByTag = (item: Movie | Series) => {
    return !tag.value || item.tags?.includes(tag.value)
  }
  const filterByCreator = (item: Movie | Series) => {
    return !creator.value || item.createdBy === creator.value
  }

  const filter = (item: Movie | Series) => {
    return filterByFilters(item) && filterBySearch(item) && filterBySchedule(item) && filterByCreator(item)
  }
  const filterScheduled = (item: Movie | Series) => {
    return filterByFilters(item) && filterBySearch(item) && !filterBySchedule(item) && filterByCreator(item)
  }
  const sortBy = computed(() => (seen.value ? bySeen : sorts[sort.value]))

  const movieList = computed(() => movies.all.filter(filter).sort(sortBy.value))
  const seriesList = computed(() => series.all.filter(filter).sort(sortBy.value))
  const scheduled = computed(() =>
    (movies.all as Array<Movie | Series>).concat(series.all).filter(filterScheduled).sort(bySchedule),
  )
  const tags = computed(() =>
    [...new Set([...movieList.value, ...seriesList.value, ...scheduled.value].flatMap((i) => i.tags || []))].sort(),
  )

  return {
    forMe: readonly(forMe),
    sort: readonly(sort),
    seen: readonly(seen),
    creator: readonly(creator),
    search,
    tag,
    movies: computed(() => movieList.value.filter(filterByTag)),
    series: computed(() => seriesList.value.filter(filterByTag)),
    scheduled: computed(() => scheduled.value.filter(filterByTag)),
    tags,
    toggleForMe() {
      forMe.value = !forMe.value

      // The creator chips only exist on the Global tab; do not leave a hidden filter behind.
      if (forMe.value) {
        creator.value = null
      }
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
    toggleTag(value: string) {
      if (tag.value === value) {
        tag.value = null
      } else {
        tag.value = value
      }
    },
    setCreator(value: string | null) {
      creator.value = value
    },
    toggleCreator(value: string) {
      if (creator.value === value) {
        creator.value = null
      } else {
        creator.value = value
      }
    },
  }
})
