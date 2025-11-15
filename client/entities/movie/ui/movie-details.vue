<script setup lang="ts">
import { useAsyncState } from '@vueuse/core'
import { Details } from '@/shared/ui'
import { useMovies } from '../model'

interface Props {
  id: string
}

const { id } = defineProps<Props>()

defineEmits(['edit', 'seen'])

const movies = useMovies()
const data = await movies.byId(id)

const { execute: refresh, isLoading: isRefreshing } = useAsyncState(() => movies.refreshData(id), null, {
  immediate: false,
})
</script>

<template>
  <Details
    :data="data"
    :refreshing="isRefreshing"
    @edit="$emit('edit')"
    @seen="$emit('seen')"
    @refresh="refresh"
    @remove-view="movies.removeMovieView(id)"
  />
</template>
