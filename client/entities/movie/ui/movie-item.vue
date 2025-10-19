<script setup lang="ts">
import { computed } from 'vue'
import type { Movie } from '@/shared/api'
import { Item } from '@/shared/ui'

interface Props {
  movie: Movie
}

const props = defineProps<Props>()
const description = computed(() => [props.movie.year, props.movie.language].filter(Boolean).join(' ⸱ '))
</script>

<template>
  <Item
    :title="movie.title"
    :imgUrl="movie.poster"
    :description="description"
    :rating="movie.seen ? movie.seenRating : movie.rating"
    :testId="`movie-${movie.id}`"
  />
</template>
