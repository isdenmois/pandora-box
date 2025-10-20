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
  <Teleport to="body">
    <div class="dialog inset-0 z-1 fixed flex items-center justify-center" :data-testid="`dialog-${id}`">
      <div class="backdrop absolute inset-0" v-on:click="goBack"></div>

      <div class="content z-1 overflow-y-auto">
        <Suspense>
          <slot />

          <template #fallback>
            <Spinner :size="32" />
          </template>
        </Suspense>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.backdrop {
  background-color: rgba(0, 0, 0, 0.6);
}

.content {
  background-color: var(--surface0);
  min-width: var(--max-dialog-width);
  border-radius: 1rem;
  max-height: 80vh;
  box-shadow: 0px 8px 8px #0002;
}

:global(#mobile > .dialog > .content) {
  width: 100%;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  align-self: end;
  box-shadow: 0px -8px 8px #0002;
}
</style>
