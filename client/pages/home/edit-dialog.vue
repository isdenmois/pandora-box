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

const parent = `/details/${type}/${id}`

const goToDetails = () => {
  router.replace(parent)
}
const goToRoot = () => {
  router.replace('/')
}
</script>

<template>
  <Dialog id="edit" :parent="parent">
    <MovieEdit v-if="type === 'movie'" :id="id" @submitted="goToDetails" @deleted="goToRoot" />
    <SeriesEdit v-if="type === 'series'" :id="id" @submitted="goToDetails" @deleted="goToRoot" />
  </Dialog>
</template>
