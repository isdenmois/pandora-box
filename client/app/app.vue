<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { onMounted } from 'vue'
import { LoginPage } from '@/pages/login'
import { useAuth, auth } from '@/shared/lib'
import { Navbar, Spinner } from '@/shared/ui'

const { isLoggedIn, initialized } = storeToRefs(useAuth())

onMounted(() => {
  auth.init()
})
</script>

<template>
  <div v-if="isLoggedIn" class="root flex flex-1 justify-center">
    <Navbar />

    <main class="flex flex-1 p-8">
      <div class="p-4 pb-5 sm:pb-4 flex-1 overflow-y-auto">
        <RouterView />
      </div>
    </main>
  </div>

  <LoginPage v-else-if="initialized" />
  <div v-else class="h-screen flex justify-center items-center">
    <Spinner :size="48" />
  </div>
</template>

<style scoped>
.root {
  background-color: var(--black);
}

.root main {
  margin: 1.5rem 1.5rem 1.5rem 0;
  background-color: var(--background);
  border-radius: 2rem;
  height: calc(100vh - 9rem);
  max-width: 80rem;
}

/* Mobile */
:global(#mobile .root) {
  flex-direction: column;
  max-height: 100dvh;
}

:global(#mobile .root > main) {
  margin: 0;
  border-radius: 0;
  padding: 0;
}
</style>
