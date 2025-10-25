<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { onMounted } from 'vue'
import { LoginPage } from '@/pages/login'
import { useAuth, auth } from '@/shared/lib'
import { ConfirmDialog, Navbar, Spinner } from '@/shared/ui'

const { isLoggedIn, initialized } = storeToRefs(useAuth())

onMounted(() => {
  auth.init()
})
</script>

<template>
  <div v-if="isLoggedIn" class="root flex flex-1 sm:justify-center">
    <main class="surface flex flex-1">
      <div class="pb-24 sm:pb-4 flex-1 overflow-y-auto overflow-x-hidden">
        <RouterView />
      </div>
    </main>

    <Navbar />
  </div>

  <LoginPage v-else-if="initialized" />
  <div v-else class="h-screen flex justify-center items-center">
    <Spinner :size="48" />
  </div>

  <ConfirmDialog />
</template>

<style>
.root {
  flex-direction: row-reverse;
  max-height: min(80rem, calc(100dvh - 9rem));
  max-width: 80rem;
  min-width: min(80rem, calc(100vw - 8rem));
  border-radius: 8px;
  overflow: hidden;
}

/* Mobile */
#mobile .root {
  flex-direction: column;
  min-width: unset;
  max-height: 100%;
  max-width: 100%;
  border-radius: 0;
  overflow: unset;
}

#mobile .root > main {
  margin: 0;
  padding: 0;
  max-height: 100dvh;
  max-width: 100%;
}
</style>
