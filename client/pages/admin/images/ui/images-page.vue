<script setup lang="ts">
import { ref } from 'vue'
import { api } from '@/shared/api'
import { useConfirm } from '@/shared/ui'

const confirm = useConfirm()

const removing = ref(false)
const removed = ref<number | null>(null)

const sweep = async () => {
  const confirmed = await confirm({
    title: 'Remove orphan images',
    message: 'Delete every poster file that no movie or series references?',
    danger: true,
  })

  if (!confirmed) {
    return
  }

  removing.value = true

  try {
    const result = await api.admin.removeOrphanImages()
    removed.value = result.removed
  } finally {
    removing.value = false
  }
}
</script>

<template>
  <h1>Images</h1>

  <p class="mt-4 color-secondary">
    Posters are downloaded on first view and stored on the server. Files left behind by deleted records, interrupted
    downloads or older formats can be removed here.
  </p>

  <button class="mt-8" :disabled="removing" @click="sweep">Remove orphan images</button>

  <div v-if="removed !== null" class="mt-4">Removed {{ removed }} file(s)</div>
</template>
