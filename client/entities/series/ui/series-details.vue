<script lang="ts">
import { searchLink } from '@/shared/lib'
import { useSeries } from '../model'

interface Props {
  id: string
}
</script>

<script setup lang="ts">
const { id } = defineProps<Props>()

const series = useSeries()
const data = await series.byId(id)
const searchUrl = searchLink(data.season ? `${data.title} ${data.season}` : data.title)
</script>

<template>
  <h1>
    <a class="not-link" :href="searchUrl" target="_blank">{{ data.title }}</a>
  </h1>

  <img v-if="data.poster" class="h-40" :src="data.poster" />

  <div v-if="data.year">Year: {{ data.year }}</div>

  <div v-if="data.rating">Rating: {{ data.rating }}</div>

  <div v-if="data.reason">Reason: {{ data.reason }}</div>

  <div v-if="data.season">Season: {{ data.season }}</div>

  <div v-if="data.genre">Genre: {{ data.genre }}</div>

  <div v-if="data.language">Language: {{ data.language }}</div>

  <div v-if="data.seen">
    <span>Seen: {{ data.seen }} {{ data.seenRating }}/10</span>

    <button v-if="data.seen" @click="series.removeSeriesView(id)">Not Seen</button>
  </div>
</template>
