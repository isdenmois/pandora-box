<script lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { MovieMarkAsViewed } from '@/entities/movie'
import { SeriesMarkAsViewed } from '@/entities/series'
import { Dialog } from '@/shared/ui'

type Params = {
  type: string
  id: string
}
</script>

<script setup lang="ts">
const router = useRouter()
const { type, id } = useRoute().params as Params

const goToDetails = () => {
  router.replace(`/details/${type}/${id}`)
}
</script>

<template>
  <Dialog id="view">
    <MovieMarkAsViewed v-if="type === 'movie'" :id="id" @submitted="goToDetails" />

    <SeriesMarkAsViewed v-if="type === 'series'" :id="id" @submitted="goToDetails" />
  </Dialog>
</template>
