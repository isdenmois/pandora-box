<script setup lang="ts">
import { type SeriesUpdate } from '@/shared/api'
import { EditForm } from '@/shared/ui'
import { useSeries } from '../model'

interface Props {
  id: string
}

const { id } = defineProps<Props>()
const emit = defineEmits(['submitted', 'deleted'])

const series = useSeries()

const data = await series.byId(id)

const save = async (input: SeriesUpdate) => {
  await series.update(id, input)

  emit('submitted')
}

const toDelete = async () => {
  series.delete(id)

  emit('deleted')
}
</script>

<template>
  <EditForm :data="data" @save="save" @delete="toDelete" />
</template>
