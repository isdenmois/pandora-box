<script setup lang="ts">
import { useAuth, auth as action } from '@/shared/lib'

const { user } = useAuth()
</script>

<template>
  <h1>Settings</h1>

  <div class="mt-8">
    <div v-if="user?.role === 'admin'">
      <RouterLink to="/admin"> admin </RouterLink>
    </div>

    <button class="mt-4" @click="action.logout">Logout</button>
  </div>
</template>
