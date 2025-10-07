<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  icon: string
  size: number
}

const { icon, size = 32 } = defineProps<Props>()

const href = computed(() => `${icon}#icon`)
</script>

<template>
  <svg class="flex-shrink-0" :height="size" :width="size">
    <use :xlink:href="href"></use>
  </svg>
</template>
