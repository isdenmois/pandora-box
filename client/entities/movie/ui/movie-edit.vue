<script setup lang="ts">
import { type MovieUpdate } from '@/shared/api'
import { EditForm } from '@/shared/ui'
import { useMovies } from '../model'

interface Props {
  id: string
}

const { id } = defineProps<Props>()
const emit = defineEmits(['submitted', 'deleted'])

const movies = useMovies()

const data = await movies.byId(id)

const save = async (input: MovieUpdate) => {
  await movies.update(id, input)

  emit('submitted')
}

const toDelete = async () => {
  movies.delete(id)

  emit('deleted')
}
</script>

<template>
  <EditForm :data="data" @save="save" @delete="toDelete" />
</template>
