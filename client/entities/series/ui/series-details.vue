<script lang="ts">
import { onMounted, ref } from 'vue'
import { api, type Series } from '@/shared/api'
import { Spinner } from '@/shared/ui'

interface Props {
  id: string
}
</script>

<script setup lang="ts">
const { id } = defineProps<Props>()

const isLoading = ref(true)
const error = ref(false)
const data = ref<Series | null>(null)

onMounted(async () => {
  try {
    data.value = await api.series.byId(id)
    isLoading.value = false
  } catch {
    error.value = true
  }
})
</script>

<template>
  <div v-if="isLoading || !data">
    <Spinner :size="32" />
  </div>
  <div v-else-if="error">Error!</div>
  <div v-else>
    <h1>{{ data.title }}</h1>

    <img v-if="data.poster" class="h-40" :src="data.poster" />

    <div v-if="data.year">Year: {{ data.year }}</div>

    <div v-if="data.rating">Rating: {{ data.rating }}</div>

    <div v-if="data.reason">Reason: {{ data.reason }}</div>

    <div v-if="data.genre">Genre: {{ data.genre }}</div>

    <div v-if="data.language">Language: {{ data.language }}</div>
  </div>
</template>
