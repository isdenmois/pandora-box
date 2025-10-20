<script setup lang="ts">
defineEmits(['click'])
</script>

<template>
  <button type="button" class="h-16 gap-2 flex w-full" @click="$emit('click')">
    <div class="space"></div>
    <div>More</div>
    <div class="space"></div>
  </button>
</template>

<style scoped>
.space {
  flex: 1;
  height: 1px;
  background-color: var(--border);
}
</style>
