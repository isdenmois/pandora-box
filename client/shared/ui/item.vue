<script setup lang="ts">
interface Props {
  title: string
  description?: string | null
  imgUrl?: string | null
  testId?: string
}

const { title, description, imgUrl, testId } = defineProps<Props>()
</script>

<template>
  <div class="flex item rounded-md overflow-hidden" :data-testid="testId">
    <img v-if="imgUrl" class="object-cover h-20 w-12" :src="imgUrl" :alt="title" />

    <div class="p-4">
      <div class="text-m">{{ title }}</div>

      <div v-if="description" class="text-s mt-2 secondary">{{ description }}</div>
    </div>
  </div>
</template>

<style scoped>
.item {
  box-shadow: 0px 4px 4px 1px rgba(0, 0, 0, 0.25);
}
</style>
