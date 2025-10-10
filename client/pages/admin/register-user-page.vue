<script setup lang="ts">
import { ref } from 'vue'
import { api } from '@/shared/api'
import { getMessage } from '@/shared/lib'

const message = ref('')
const username = ref('')
const password = ref('')

const register = async () => {
  try {
    await api.admin.register(username.value, password.value)

    username.value = ''
    password.value = ''
  } catch (error) {
    message.value = getMessage(error)
  }
}
</script>

<template>
  <h1>Register a user</h1>

  <form class="mt-8" @submit.prevent="register">
    <input
      name="username"
      :class="{ error: message }"
      type="text"
      autocapitalize="off"
      placeholder="Username"
      v-model="username"
    />

    <input class="mt-4" :class="{ error: message }" type="password" placeholder="Password" v-model="password" />

    <p v-if="message" class="mt-4" style="color: red">{{ message }}</p>

    <div class="mt-4">
      <button type="submit">Register</button>
    </div>
  </form>
</template>
