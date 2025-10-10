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
  <h1>Home</h1>

  <div class="flex gap-4">
    <button class="secondary" :class="{ selected: home.forMe }" @click="home.toggleForMe">For Me</button>
    <button @click="home.toggleSort">By {{ home.sort }}</button>
  </div>

  <p class="mt-8">All Series</p>

  <Spinner v-if="series.isLoading && !home.series.length" :size="24" />

  <ul>
    <li v-for="item in home.series" :key="item.id" class="mt-4">
      <RouterLink class="not-link" :to="`/details/series/${item.id}`">
        <SeriesItem :series="item" />
      </RouterLink>
    </li>
  </ul>

  <p class="mt-8">All Movies</p>

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
