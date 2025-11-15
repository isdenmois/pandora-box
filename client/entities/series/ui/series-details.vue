<script setup lang="ts">
import { useAsyncState } from '@vueuse/core'
import { Details } from '@/shared/ui'
import { useSeries } from '../model'

interface Props {
  id: string
}

const { id } = defineProps<Props>()
defineEmits(['edit', 'seen'])

const series = useSeries()
const data = await series.byId(id)

const { execute: refresh, isLoading: isRefreshing } = useAsyncState(() => series.refreshData(id), null, {
  immediate: false,
})

const updateSeason = (season: number) => {
  series.setSeason(id, season)
}
</script>

<template>
  <Details
    :data="data"
    :refreshing="isRefreshing"
    @edit="$emit('edit')"
    @seen="$emit('seen')"
    @update-season="updateSeason"
    @refresh="refresh"
    @remove-view="series.removeSeriesView(id)"
  >
    <slot />
  </Details>
</template>
