import { defineStore } from 'pinia'
import { computed, shallowRef } from 'vue'
import type { User } from '../../api'

export const useAuth = defineStore('auth', () => {
  const user = shallowRef<User | null | undefined>(undefined)

  const initialized = computed(() => user.value !== undefined)
  const isLoggedIn = computed(() => !!user.value)

  const setUser = (data: User | null) => {
    user.value = data
  }

  return {
    user,
    initialized,
    isLoggedIn,
    setUser,
  }
})
