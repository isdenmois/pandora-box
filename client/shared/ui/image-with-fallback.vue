<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  src?: string | null
  alt?: string | null
}

const props = defineProps<Props>()

defineOptions({ inheritAttrs: false })

const failed = ref(false)

// A new source deserves a new attempt; the previous failure is not predictive of this one.
watch(
  () => props.src,
  () => {
    failed.value = false
  },
)

const onError = () => {
  failed.value = true
}
</script>

<template>
  <img v-if="src && !failed" v-bind="$attrs" :src="src" :alt="alt ?? ''" @error="onError">
  <!-- Same sizing classes as the image so the layout does not jump when the poster is missing. -->
  <div v-else v-bind="{ class: $attrs.class }"></div>
</template>
