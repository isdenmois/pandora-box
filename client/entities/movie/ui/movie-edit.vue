<script setup lang="ts">
import { ref } from 'vue'
import { type MovieUpdate } from '@/shared/api'
import { EditForm } from '@/shared/ui'
import { useMovies } from '../model'

interface Props {
  id: string
  tags: string[]
}

const { id } = defineProps<Props>()
const emit = defineEmits(['submitted', 'deleted'])

const movies = useMovies()

const data = await movies.byId(id)

const posterKey = ref(0)
const redownloading = ref(false)

const save = async (input: MovieUpdate) => {
  if ('season' in input) {
    delete input.season
  }
  await movies.update(id, input)

  emit('submitted')
}

const toDelete = async () => {
  movies.delete(id)

  emit('deleted')
}

const toRedownload = async () => {
  redownloading.value = true

  try {
    await movies.redownloadPoster(id)
    // The path stays the same, so the image has to remount to be requested again.
    posterKey.value++
  } finally {
    redownloading.value = false
  }
}
</script>

<template>
  <EditForm
    :data="data"
    :tags="tags"
    :poster-key="posterKey"
    :redownloading="redownloading"
    @save="save"
    @delete="toDelete"
    @redownload="toRedownload"
  />
</template>
