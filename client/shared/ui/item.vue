<script setup lang="ts">
interface Props {
  title: string
  description?: string | null
  rating?: string | number | null
  imgUrl?: string | null
  testId?: string
}

defineProps<Props>()
</script>

<template>
  <div class="flex item overflow-hidden relative color-primary" :data-testid="testId">
    <img v-if="imgUrl" class="object-cover h-20 w-12" :src="imgUrl" :alt="title" />

    <div class="p-4">
      <div class="text-m">{{ title }}</div>

      <div v-if="description" class="text-s mt-2">{{ description }}</div>
    </div>

    <div v-if="rating" class="rating text-m absolute top-0 right-0 p-1">
      {{ rating }}
    </div>
  </div>
</template>

<style scoped>
.item {
  background-color: var(--surface2);
  border-radius: 6px;
  box-shadow: 0px 4px 4px 1px rgba(0, 0, 0, 0.25);
}

.rating {
  background-color: var(--warning2);
  color: var(--warning);
  min-width: 32px;
  text-align: center;
  border-top-left-radius: 2px;
  border-top-right-radius: 6px;
  border-bottom-left-radius: 4px;
  border-bottom-right-radius: 2px;
  font-weight: bold;
}
</style>
