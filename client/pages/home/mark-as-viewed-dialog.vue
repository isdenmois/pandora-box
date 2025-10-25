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

const parent = `/details/${type}/${id}`
const goToDetails = () => {
  router.replace(parent)
}
</script>

<template>
  <Dialog id="view" className="p-4" :parent="parent">
    <MovieMarkAsViewed v-if="type === 'movie'" :id="id" @submitted="goToDetails" />

    <SeriesMarkAsViewed v-if="type === 'series'" :id="id" @submitted="goToDetails" />
  </Dialog>
</template>
