<script lang="ts">
import { useRoute } from 'vue-router'
import { MovieDetails } from '@/entities/movie'
import { SeriesDetails } from '@/entities/series'
import { Dialog } from '@/shared/ui'

type Params = {
  type: string
  id: string
}
</script>

<script setup lang="ts">
const { type, id } = useRoute().params as Params
</script>

<template>
  <Dialog id="details">
    <MovieDetails v-if="type === 'movie'" :id="id" />

    <SeriesDetails v-if="type === 'series'" :id="id" />

    <RouterLink :to="`/edit/${type}/${id}`">
      <button>Edit</button>
    </RouterLink>
  </Dialog>
</template>
