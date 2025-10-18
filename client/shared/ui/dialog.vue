<script setup lang="ts">
import { useRouter } from 'vue-router'
import Spinner from './spinner.vue'

interface Props {
  parent?: string
  id: string
}

const { parent = '/', id } = defineProps<Props>()
const router = useRouter()

const goBack = () => {
  router.replace(parent)
}
</script>

<template>
  <div class="inset-0 fixed flex items-center justify-center" :data-testid="`dialog-${id}`">
    <div class="backdrop absolute inset-0" v-on:click="goBack"></div>

    <div class="content p-4 z-1 overflow-y-auto">
      <Suspense>
        <slot />

        <template #fallback>
          <Spinner :size="32" />
        </template>
      </Suspense>
    </div>
  </div>
</template>

<style scoped>
.backdrop {
  background-color: rgba(0, 0, 0, 0.5);
}

.content {
  background-color: var(--surface0);
  min-width: var(--max-dialog-width);
  border-radius: 1rem;
  max-height: 80vh;
}
</style>
