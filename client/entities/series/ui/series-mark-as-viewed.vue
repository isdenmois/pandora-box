<script setup lang="ts">
import { MarkAsViewed, type SeenData } from '@/shared/ui'
import { useSeries } from '../model'

interface Props {
  id: string
}

const { id } = defineProps<Props>()
const emit = defineEmits(['submitted'])

const series = useSeries()
const data = await series.byId(id)

async function submit({ date, rating }: SeenData) {
  series.markAsViewed(id, date, rating)

  emit('submitted')
}
</script>

<template>
  <MarkAsViewed :data="data" @save="submit" />
</template>
