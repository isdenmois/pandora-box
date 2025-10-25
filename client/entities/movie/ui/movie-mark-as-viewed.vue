<script setup lang="ts">
import { MarkAsViewed, type SeenData } from '@/shared/ui'
import { useMovies } from '../model'

interface Props {
  id: string
}

const { id } = defineProps<Props>()
const emit = defineEmits(['submitted'])

const movies = useMovies()
const data = await movies.byId(id)

async function submit({ date, rating }: SeenData) {
  movies.markAsViewed(id, date, rating)

  emit('submitted')
}
</script>

<template>
  <MarkAsViewed :data="data" @save="submit" />
</template>
