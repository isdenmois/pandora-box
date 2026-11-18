<script setup lang="ts">
import { ref } from 'vue'
import { type SeriesUpdate } from '@/shared/api'
import { EditForm } from '@/shared/ui'
import { useSeries } from '../model'

interface Props {
  id: string
  tags: string[]
}

const { id } = defineProps<Props>()
const emit = defineEmits(['submitted', 'deleted'])

const series = useSeries()

const data = await series.byId(id)

const posterKey = ref(0)
const redownloading = ref(false)

const save = async (input: SeriesUpdate) => {
  await series.update(id, input)

  emit('submitted')
}

const toDelete = async () => {
  series.delete(id)

  emit('deleted')
}

const toRedownload = async () => {
  redownloading.value = true

  try {
    await series.redownloadPoster(id)
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
