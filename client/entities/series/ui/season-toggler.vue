<script setup lang="ts">
import { Icon, icons } from '@/shared/ui'
const model = defineModel<number>({
  default: 0,
})

interface Props {
  disabled?: boolean
  total?: number | null
}
defineProps<Props>()
</script>

<template>
  <div class="flex items-center gap-2">
    <button
      type="button"
      class="primary icon"
      :disabled="!!disabled || model <= 1"
      @click="model--"
      data-testid="season-minus"
    >
      <Icon :size="24" :icon="icons.minus" />
    </button>

    <div class="text-m">
      <span>{{ model }}</span>
      <span v-if="total && total > 0"> of {{ total }}</span>
    </div>

    <button
      type="button"
      class="primary icon"
      :disabled="!!disabled || (!!total && model >= total)"
      @click="model++"
      data-testid="season-plus"
    >
      <Icon :size="24" :icon="icons.plus" />
    </button>
  </div>
</template>
