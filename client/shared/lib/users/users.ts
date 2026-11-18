import { defineStore } from 'pinia'
import { readonly, ref } from 'vue'
import { api, type UserSummary } from '@/shared/api'

/**
 * The user directory: id + username for attribution labels and the recommender picker. It is
 * loaded once after auth; an unresolved id falls back to "Unknown" instead of blocking a view.
 */
export const useUsers = defineStore('users', () => {
  const all = ref<UserSummary[]>([])
  const isLoading = ref(false)

  const refresh = async () => {
    isLoading.value = true

    try {
      all.value = await api.user.list()
    } catch {
      all.value = []
    } finally {
      isLoading.value = false
    }
  }

  const byId = (id: string | null | undefined) => all.value.find((user) => user.id === id)

  const nameFor = (id: string | null | undefined) => {
    if (!id) {
      return null
    }

    return byId(id)?.username ?? 'Unknown'
  }

  const clear = () => {
    all.value = []
  }

  return {
    all,
    isLoading: readonly(isLoading),
    byId,
    nameFor,
    refresh,
    clear,
  }
})
