<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { onMounted, watch } from 'vue'
import { auth, useAuth, useUsers } from '@/shared/lib'
import { ConfirmDialog, Spinner } from '@/shared/ui'
import { LoginPage } from '@/pages/login'
import Navbar from './ui/navbar.vue'

const { isLoggedIn, initialized } = storeToRefs(useAuth())
const users = useUsers()

// The directory powers every attribution label and the recommender picker. Load it as soon as a
// session exists, including after a login that happens without remounting the app.
watch(
  isLoggedIn,
  (loggedIn) => {
    if (loggedIn) {
      users.refresh()
    } else {
      users.clear()
    }
  },
  { immediate: true },
)

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
