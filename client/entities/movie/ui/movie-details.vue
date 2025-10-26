<script setup lang="ts">
import { Details } from '@/shared/ui'

import { useMovies } from '../model'

interface Props {
  id: string
}

const { id } = defineProps<Props>()

defineEmits(['edit', 'seen'])

const movies = useMovies()
const data = await movies.byId(id)
const togglePrivate = () => movies.togglePrivate(id)
</script>

<template>
  <Details
    :data="data"
    @edit="$emit('edit')"
    @seen="$emit('seen')"
    @remove-view="movies.removeMovieView(id)"
    @toggle-private="togglePrivate"
  />
</template>
