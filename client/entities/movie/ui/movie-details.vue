<script setup lang="ts">
import { searchLink } from '@/shared/lib'
import { useMovies } from '../model'

interface Props {
  id: string
}

const { id } = defineProps<Props>()

const movies = useMovies()
const data = await movies.byId(id)
const searchUrl = searchLink(data.title)
</script>

<template>
  <h1>
    <a class="not-link" :href="searchUrl" target="_blank">{{ data.title }}</a>
  </h1>

  <img v-if="data.poster" class="h-40" :src="data.poster" />

  <div v-if="data.year">Year: {{ data.year }}</div>

  <div v-if="data.rating">Rating: {{ data.rating }}</div>

  <div v-if="data.reason">Reason: {{ data.reason }}</div>

  <div v-if="data.genre">Genre: {{ data.genre }}</div>

  <div v-if="data.language">Language: {{ data.language }}</div>

  <div v-if="data.seen">
    Seen: {{ data.seen }}

    <button v-if="data.seen" @click="movies.removeMovieView(id)">Not Seen</button>
  </div>
</template>
