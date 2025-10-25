<script setup lang="ts">
import Icon from './icon.vue'
import { icons } from './icons'

const max = 10
const model = defineModel<number>()
const datas = Array.from({ length: max }, (_, i) => i + 1)
</script>

<template>
  <div class="flex items-center">
    <div
      class="star"
      :class="{ selected: model && item <= model }"
      v-for="item of datas"
      :key="item"
      @click="model = item"
    >
      <Icon :size="20" :icon="model && item <= model ? icons.starFill : icons.star" />
    </div>
  </div>
</template>
<style>
.star {
  color: var(--text-secondary);
  cursor: pointer;
}

.star.selected {
  color: var(--warning);
}
</style>
