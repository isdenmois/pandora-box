<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'
import { onBeforeMount, ref } from 'vue'
import { useMovies, MovieItem } from '@/entities/movie'
import { useSeries, SeriesItem } from '@/entities/series'
import { Icon, Spinner, icons } from '@/shared/ui'
import { useHome } from './model'

const home = useHome()
const series = useSeries()
const movies = useMovies()

const seriesVisible = ref(true)
const moviesVisible = ref(true)

const searchVisible = ref(false)
const searchElement = ref<HTMLInputElement | null>(null)
const openSearch = () => {
  searchVisible.value = true
}
const closeSearch = () => {
  searchElement.value?.blur()
  searchVisible.value = false
}

onClickOutside(searchElement, () => {
  if (searchVisible.value) {
    searchVisible.value = false
  }
})

onBeforeMount(() => {
  series.refresh()
  movies.refresh()
})
</script>

<template>
  <div class="surface p-4 sm:pl-10 sm:pt-6 flex gap-6 sticky top-0 z-1">
    <button class="group gap-3" @click="home.toggleForMe">
      <span :class="{ active: !home.forMe, 'max-zf:hidden': home.forMe }">Global</span>
      <span :class="{ active: home.forMe, 'max-zf:hidden': !home.forMe }">For Me</span>
    </button>

    <button class="color-secondary" @click="home.toggleSort">
      <template v-if="home.sort === 'rating'">
        <Icon :size="24" :icon="icons.sortDesc" />
      </template>
      <template v-else-if="home.sort === 'title'">
        <Icon :size="24" :icon="icons.sortAsc" />
      </template>

      by {{ home.sort }}
    </button>

    <button class="gap-2" @click="home.toggleSeen" :title="home.seen ? 'Seen' : 'New'">
      <template v-if="home.seen">
        <Icon :size="24" :icon="icons.seen" />
      </template>
      <template v-else>
        <Icon class="color-secondary" :size="24" :icon="icons.unseen" />
      </template>
    </button>

    <div class="flex-1"></div>

    <button :class="{ 'color-secondary': !home.search }" @click="openSearch">
      <Icon :size="24" :icon="icons.search" />
    </button>

    <form
      class="search absolute left-4 right-4"
      :class="{ visible: searchVisible }"
      @submit.prevent="closeSearch"
      @transitionend="searchVisible && searchElement?.focus()"
    >
      <label class="search">
        <Icon :size="24" :icon="icons.search" />

        <input ref="searchElement" type="text" class="w-full" name="filter" v-model="home.search" />
      </label>
    </form>
  </div>

  <h1 class="mt-2 px-4 sm:pl-10 cursor-pointer" @click="seriesVisible = !seriesVisible">Series</h1>

  <Spinner v-if="series.isLoading && !home.series.length" :size="24" />

  <ul v-if="seriesVisible" class="px-4 sm:pl-10 sm:flex gap-6 flex-wrap">
    <li v-for="item in home.series" :key="item.id" class="mt-4">
      <RouterLink class="not-link" :to="`/details/series/${item.id}`">
        <SeriesItem :series="item" />
      </RouterLink>
    </li>
  </ul>

  <h1 class="mt-8 px-4 sm:pl-10 cursor-pointer" @click="moviesVisible = !moviesVisible">Movies</h1>

  <Spinner v-if="movies.isLoading && !home.movies.length" :size="24" />

  <ul v-if="moviesVisible" class="px-4 sm:pl-10 sm:flex gap-6 flex-wrap">
    <li v-for="movie in home.movies" :key="movie.id" class="mt-4">
      <RouterLink class="not-link" :to="`/details/movie/${movie.id}`">
        <MovieItem :movie />
      </RouterLink>
    </li>
  </ul>

  <router-view />
</template>

<style scoped>
form.search {
  opacity: 0;
  transition: transform 100ms;
  transform: translateX(100%);
}

form.search.visible {
  opacity: 1;
  transform: translateX(0);
}
</style>
