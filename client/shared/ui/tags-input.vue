<script setup lang="ts">
import { computed, ref } from 'vue'

interface Props {
  tags: string[]
}

const { tags } = defineProps<Props>()
const model = defineModel<string[]>()
const newTag = ref('')

const toggleTag = (tag: string) => {
  if (model.value?.includes(tag)) {
    model.value = model.value.filter((t) => t !== tag)
  } else {
    model.value = (model.value || []).concat(tag)
  }
}
const addTag = () => {
  newTag.value = newTag.value.trim()

  if (newTag.value) {
    model.value = [...(model.value || []), newTag.value]
    newTag.value = ''
  }
}

const allTags = computed(() => [...new Set([...tags, ...(model.value || [])].filter((t) => t.trim()))].sort())
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <button
      v-for="tag of allTags"
      :key="tag"
      type="button"
      :class="modelValue?.includes(tag) ? 'primary' : 'secondary'"
      @click="toggleTag(tag)"
    >
      {{ tag }}
    </button>
  </div>

  <form class="flex gap-4 mt-2" @submit.prevent="addTag">
    <input class="flex-1" placeholder="Add new tag" v-model="newTag" enterkeyhint="enter" />
    <button class="primary">Add</button>
  </form>
</template>
