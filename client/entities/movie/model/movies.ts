import { readonly, shallowRef } from 'vue'
import { defineStore } from 'pinia'
import { api, type Movie, type MovieCreate } from '@/shared/api'

export const useMovies = defineStore('movies', () => {
  const all = shallowRef<Movie[]>([])
  const isLoading = shallowRef(false)

  return {
    all: readonly(all),
    isLoading: readonly(isLoading),
    async refresh() {
      isLoading.value = true

      try {
        all.value = await api.movie.getAll()
      } finally {
        isLoading.value = false
      }
    },

    async create(data: MovieCreate) {
      const movie = await api.movie.create(data)

      all.value = [...all.value, movie]
    },
  }
})
