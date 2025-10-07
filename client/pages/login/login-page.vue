<script setup lang="ts">
import { ref } from 'vue'
import { auth, getMessage } from '@/shared/lib'

const username = ref('')
const password = ref('')
const message = ref('')

const handleSubmit = async () => {
  try {
    if (username.value && password.value) {
      await auth.login(username.value, password.value)
    }
  } catch (error) {
    message.value = getMessage(error)
  }
}
</script>

<template>
  <main class="login flex flex-col flex-1 items-center justify-center">
    <form class="flex flex-col" @submit.prevent="handleSubmit">
      <h1 class="pt-4 text-center">Login</h1>

      <input
        class="mt-8"
        :class="{ error: message }"
        type="text"
        autocapitalize="off"
        placeholder="Username"
        v-model="username"
      />
      <input class="mt-4" :class="{ error: message }" type="password" placeholder="Password" v-model="password" />

      <p v-if="message" class="mt-4 error">{{ message }}</p>

      <button class="mt-8" type="submit" :disabled="!username || !password">Sign In</button>
    </form>
  </main>
</template>

<style scoped>
form {
  background-color: var(--card);
  padding: 2rem 1.5rem;
  border-radius: 1rem;
}

input {
  width: 16rem;
}

input.error {
  border: 1px solid red;
}

/* Mobile */
:global(#mobile main.login) {
  align-items: stretch;
  background-color: transparent;
}

:global(#mobile .login input) {
  width: auto;
}
</style>
