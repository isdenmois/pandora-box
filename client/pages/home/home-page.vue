<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'
import { onBeforeMount, ref } from 'vue'
import { MovieItem, useMovies } from '@/entities/movie'
import { SeriesItem, useSeries } from '@/entities/series'
import { useUsers } from '@/shared/lib'
import { Icon, icons, Spinner } from '@/shared/ui'
import { useHome } from './model'

const home = useHome()
const series = useSeries()
const movies = useMovies()
const users = useUsers()

const seriesVisible = ref(true)
const moviesVisible = ref(true)
const filtersVisible = ref(false)

const toggleFilters = () => {
  filtersVisible.value = !filtersVisible.value

  // Do not leave an active creator filter hidden behind a closed panel.
  if (!filtersVisible.value) {
    home.setCreator(null)
  }
}

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
  <div class="surface p-3 sm:pl-10 sm:pt-6 flex gap-6 sticky top-0 z-1">
    <button class="group gap-3" @click="home.toggleForMe">
      <span :class="{ active: !home.forMe, 'max-zf:hidden': home.forMe }">Global</span>
      <span :class="{ active: home.forMe, 'max-zf:hidden': !home.forMe }">For Me</span>
    </button>

    <button class="gap-2" @click="home.toggleSeen" :title="home.seen ? 'Seen' : 'New'">
      <template v-if="home.seen">
        <Icon :size="24" :icon="icons.seen" />
      </template>
      <template v-else>
        <Icon class="color-secondary" :size="24" :icon="icons.unseen" />
      </template>
    </button>

    <button
      v-if="!home.forMe"
      class="gap-2"
      :class="{ 'color-secondary': !filtersVisible }"
      aria-label="Filters"
      :title="filtersVisible ? 'Hide added-by filter' : 'Show added-by filter'"
      @click="toggleFilters"
    >
      <Icon :size="24" :icon="icons.filter" />
    </button>

    <div class="flex-1"></div>

    <button
      aria-label="Search"
      :aria-expanded="searchVisible"
      :class="{ 'color-secondary': !home.search }"
      @click="openSearch"
    >
      <Icon :size="24" :icon="icons.search" />
    </button>

    <form
      class="search absolute left-3 right-3 top-2 sm:top-4"
      :class="{ visible: searchVisible }"
      @submit.prevent="closeSearch"
      @transitionend="searchVisible && searchElement?.focus()"
    >
      <label class="search">
        <Icon :size="24" :icon="icons.search" />

        <input ref="searchElement" type="text" class="w-full" name="filter" v-model="home.search">
      </label>
    </form>
  </div>

  <div class="flex flex-wrap items-center gap-4 px-2 sm:pl-8">
    <button v-if="!home.seen" class="color-secondary" @click="home.toggleSort">
      <template v-if="home.sort === 'rating' || home.sort === 'season'">
        <Icon :size="24" :icon="icons.sortDesc" />
      </template>
      <template v-else-if="home.sort === 'title'">
        <Icon :size="24" :icon="icons.sortAsc" />
      </template>

      by {{ home.sort }}
    </button>

    <button
      v-for="tag of home.tags"
      :key="tag"
      :aria-pressed="tag === home.tag"
      :class="tag === home.tag ? 'primary' : 'secondary'"
      @click="home.toggleTag(tag)"
    >
      {{ tag }}
    </button>
  </div>

  <div
    v-if="filtersVisible && !home.forMe && users.all.length > 0"
    class="flex flex-wrap items-center gap-4 px-2 sm:pl-8 mt-2"
  >
    <span class="color-secondary text-s">Added by</span>

    <button
      :aria-pressed="home.creator === null"
      :class="home.creator === null ? 'primary' : 'secondary'"
      @click="home.setCreator(null)"
    >
      Anyone
    </button>

    <button
      v-for="user of users.all"
      :key="user.id"
      :aria-pressed="home.creator === user.id"
      :class="home.creator === user.id ? 'primary' : 'secondary'"
      @click="home.toggleCreator(user.id)"
    >
      {{ user.username }}
    </button>
  </div>

  <h1 v-if="home.series.length > 0" class="mt-4 px-4 sm:pl-10 cursor-pointer" @click="seriesVisible = !seriesVisible">
    Series
  </h1>

  <Spinner v-if="series.isLoading && !home.series.length" :size="24" />

  <ul v-if="seriesVisible" class="px-4 sm:pl-10 sm:flex gap-6 flex-wrap">
    <li v-for="item in home.series" :key="item.id" class="mt-4">
      <RouterLink class="not-link" :to="`/details/series/${item.id}`">
        <SeriesItem :series="item" />
      </RouterLink>
    </li>
  </ul>

  <h1 v-if="home.movies.length > 0" class="mt-8 px-4 sm:pl-10 cursor-pointer" @click="moviesVisible = !moviesVisible">
    Movies
  </h1>

  <Spinner v-if="movies.isLoading && !home.movies.length" :size="24" />

  <ul v-if="moviesVisible" class="px-4 sm:pl-10 sm:flex gap-6 flex-wrap">
    <li v-for="movie in home.movies" :key="movie.id" class="mt-4">
      <RouterLink class="not-link" :to="`/details/movie/${movie.id}`">
        <MovieItem :movie />
      </RouterLink>
    </li>
  </ul>

  <template v-if="home.scheduled.length">
    <h1 class="mt-8 px-4 sm:pl-10">Scheduled</h1>

    <ul class="px-4 sm:pl-10 sm:flex gap-6 flex-wrap">
      <li v-for="item in home.scheduled" :key="item.id" class="mt-4">
        <RouterLink v-if="'season' in item" class="not-link" :to="`/details/series/${item.id}`">
          <SeriesItem :series="item" />
        </RouterLink>

        <RouterLink v-else class="not-link" :to="`/details/movie/${item.id}`">
          <MovieItem :movie="item" />
        </RouterLink>
      </li>
    </ul>
  </template>

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
