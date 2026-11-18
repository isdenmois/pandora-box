<script lang="ts" setup>
import Icon from './icon.vue'
import svg from './spinner.svg'

interface Props {
  size: number
}

const { size } = defineProps<Props>()
</script>

<template>
  <Icon role="status" aria-label="Loading" :icon="svg" :size="size" />
</template>
