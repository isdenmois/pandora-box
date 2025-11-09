<script setup lang="ts">
import { computed } from 'vue'
import type { Movie } from '@/shared/api'
import { formatDate } from '@/shared/lib'
import { ItemAdaptive } from '@/shared/ui'

interface Props {
  movie: Movie
}

const props = defineProps<Props>()
const description = computed(() => [props.movie.year, props.movie.language].filter(Boolean).join(' ⸱ '))
const details = computed(() => {
  const { seen, scheduled } = props.movie

  if (seen) {
    return formatDate(seen)
  }
  if (scheduled && scheduled > 0) {
    return formatDate(scheduled)
  }

  return null
})
</script>

<template>
  <ItemAdaptive
    :title="movie.title"
    :imgUrl="movie.poster"
    :description="description"
    :rating="movie.seen ? movie.seenRating : movie.rating"
    :details="details"
    :testId="`movie-${movie.id}`"
  />
</template>
