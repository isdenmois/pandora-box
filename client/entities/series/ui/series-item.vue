<script setup lang="ts">
import { computed } from 'vue'
import type { Series } from '@/shared/api'
import { ItemAdaptive } from '@/shared/ui'

interface Props {
  series: Series
}

const props = defineProps<Props>()
const description = computed(() =>
  [props.series.year, props.series.season ? `Season ${props.series.season}` : null].filter(Boolean).join(' ⸱ '),
)
</script>

<template>
  <ItemAdaptive
    :title="series.title"
    :imgUrl="series.poster"
    :description="description"
    :rating="series.seen ? series.seenRating : series.rating"
    :testId="`series-${series.id}`"
  />
</template>
