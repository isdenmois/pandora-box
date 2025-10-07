<script setup lang="ts">
import type { Movie } from '@/shared/api'
import { Item } from '@/shared/ui'
import { computed } from 'vue'

interface Props {
  movie: Movie
}

const props = defineProps<Props>()
const description = computed(() =>
  [props.movie.year, props.movie.language, props.movie.rating].filter(Boolean).join(' ⸱ '),
)
</script>

<template>
  <Item :title="movie.title" :imgUrl="movie.poster" :description="description" :testId="`movie-${movie.id}`" />
</template>
