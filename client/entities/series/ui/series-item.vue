<script setup lang="ts">
import { computed } from 'vue'
import type { Series } from '@/shared/api'
import { isMobile } from '@/shared/lib'
import { ItemAdaptive } from '@/shared/ui'

interface Props {
  series: Series
}

const props = defineProps<Props>()
const season = computed(() => props.series.season || 1)
const description = computed(() =>
  [props.series.year, season.value ? `Season ${props.series.season}` : null].filter(Boolean).join(' ⸱ '),
)
const title = computed(() =>
  !isMobile.value && season.value > 1 ? `${props.series.title} S${season.value}` : props.series.title,
)
</script>

<template>
  <ItemAdaptive
    :title="title"
    :imgUrl="series.poster"
    :description="description"
    :rating="series.seen ? series.seenRating : series.rating"
    :testId="`series-${series.id}`"
  />
</template>
