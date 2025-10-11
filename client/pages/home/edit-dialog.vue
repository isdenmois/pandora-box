<script lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { MovieEdit } from '@/entities/movie'
import { SeriesEdit } from '@/entities/series'
import { Dialog } from '@/shared/ui'

type Props = {
  id: string
  type: string
}
</script>

<script setup lang="ts">
const { id, type } = useRoute().params as Props
const router = useRouter()

const goToDetails = () => {
  router.replace(`/details/${type}/${id}`)
}
</script>

<template>
  <Dialog id="edit">
    <MovieEdit v-if="type === 'movie'" :id="id" @submitted="goToDetails" />
    <SeriesEdit v-if="type === 'series'" :id="id" @submitted="goToDetails" />
  </Dialog>
</template>
