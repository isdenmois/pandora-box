<script setup lang="ts">
import { onBeforeMount } from 'vue'
import { useMovies, MovieItem } from '@/entities/movie'
import { useSeries, SeriesItem } from '@/entities/series'
import { Spinner } from '@/shared/ui'
import { useHome } from './model'

const home = useHome()
const series = useSeries()
const movies = useMovies()

onBeforeMount(() => {
  series.refresh()
  movies.refresh()
})
</script>

<template>
  <div class="flex gap-4">
    <button class="secondary" :class="{ selected: home.forMe }" @click="home.toggleForMe">For Me</button>
    <button class="secondary" :class="{ selected: home.seen }" @click="home.toggleSeen">Seen</button>
    <button @click="home.toggleSort">By {{ home.sort }}</button>
  </div>

  <h1 class="mt-6">Series</h1>

  <Spinner v-if="series.isLoading && !home.series.length" :size="24" />

  <ul>
    <li v-for="item in home.series" :key="item.id" class="mt-4">
      <RouterLink class="not-link" :to="`/details/series/${item.id}`">
        <SeriesItem :series="item" />
      </RouterLink>
    </li>
  </ul>

  <h1 class="mt-8">Movies</h1>

  <Spinner v-if="movies.isLoading && !home.movies.length" :size="24" />

  <ul>
    <li v-for="movie in home.movies" :key="movie.id" class="mt-4">
      <RouterLink class="not-link" :to="`/details/movie/${movie.id}`">
        <MovieItem :movie />
      </RouterLink>
    </li>
  </ul>

  <router-view />
</template>
