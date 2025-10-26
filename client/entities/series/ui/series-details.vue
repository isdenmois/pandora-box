<script setup lang="ts">
import { Details } from '@/shared/ui'
import { useSeries } from '../model'

interface Props {
  id: string
}

const { id } = defineProps<Props>()
defineEmits(['edit', 'seen'])

const series = useSeries()
const data = await series.byId(id)

const updateSeason = (season: number) => {
  series.setSeason(id, season)
}
const togglePrivate = () => series.togglePrivate(id)
</script>

<template>
  <Details
    :data="data"
    @edit="$emit('edit')"
    @seen="$emit('seen')"
    @update-season="updateSeason"
    @remove-view="series.removeSeriesView(id)"
    @toggle-private="togglePrivate"
  >
    <slot />
  </Details>
</template>
