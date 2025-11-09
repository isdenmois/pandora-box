<script setup lang="ts">
import { computed, ref } from 'vue'
import { dateToString, vShowPickerOnMount } from '../lib'

const model = defineModel<number | null>()
const modelDate = computed(() => (model.value && model.value > 0 ? dateToString(new Date(model.value)) : null))
const input = ref<HTMLInputElement | null>()
let changed = false

const onDateChange = () => {
  model.value = input.value?.valueAsNumber || model.value
}
const select = (value: number | null) => {
  if (value && value > 0 && model.value && model.value > 0) {
    return
  }

  changed = true
  model.value = value
}
</script>

<template>
  <div class="flex gap-4">
    <button type="button" class="group primary mt-1 gap-3">
      <span :class="{ active: !model }" @click="select(null)">No</span>
      <span :class="{ active: model === -1 }" @click="select(-1)">Yes</span>
      <span :class="{ active: model && model > 0 }" @click="select(Date.now())">Date</span>
    </button>

    <input
      v-if="modelDate"
      type="date"
      :value="modelDate"
      @change="onDateChange"
      ref="input"
      v-show-picker-on-mount="changed"
    />
  </div>
</template>
