import { defineStore } from 'pinia'
import { readonly, ref, shallowRef } from 'vue'
import type { MovieUpdate } from '@/server/*'
import { api, type Movie, type MovieCreate } from '@/shared/api'

export const useMovies = defineStore('movies', () => {
  const all = ref<Movie[]>([])
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

    async byId(id: string) {
      const existed = all.value.find((movie) => movie.id === id)

      if (existed) {
        return existed
      }

      const movie = await api.movie.byId(id)

      all.value.push(movie)

      return movie
    },

    async update(id: string, data: MovieUpdate) {
      const existed = all.value.find((movie) => movie.id === id)

      if (existed) {
        Object.assign(existed, data)
      }

      await api.movie.update(id, data)
    },

    async markAsViewed(id: string, date: string, rating: number) {
      const existed = all.value.find((movie) => movie.id === id)

      if (existed) {
        Object.assign(existed, { seen: date, seenRating: rating })
      }

      await api.movie.markAsViewed(id, date, rating)
    },

    async removeMovieView(id: string) {
      const existed = all.value.find((movie) => movie.id === id)

      if (existed) {
        Object.assign(existed, { seen: null })
      }

      await api.movie.removeMovieView(id)
    },
  }
})
