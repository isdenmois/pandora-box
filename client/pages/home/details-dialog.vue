<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { MovieDetails } from '@/entities/movie'
import { SeriesDetails } from '@/entities/series'
import { Dialog } from '@/shared/ui'

type Params = {
  type: string
  id: string
}

const { type, id } = useRoute().params as Params
const router = useRouter()
const edit = () => router.push(`/edit/${type}/${id}`)
const seen = () => router.push(`/seen/${type}/${id}`)
</script>

<template>
  <Dialog id="details">
    <MovieDetails v-if="type === 'movie'" :id="id" @edit="edit" @seen="seen" />

    <SeriesDetails v-if="type === 'series'" :id="id" @edit="edit" @seen="seen" />
  </Dialog>
</template>
