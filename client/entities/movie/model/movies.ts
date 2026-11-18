import { defineStore } from 'pinia'
import { readonly, ref, shallowRef } from 'vue'
import { api, type Movie, type MovieCreate } from '@/shared/api'
import { isOmdb, isOmdbString, useAuth } from '@/shared/lib'
import type { MovieUpdate } from '@/server/*'

export const useMovies = defineStore('movies', () => {
  const all = ref<Movie[]>([])
  const isLoading = shallowRef(false)

  return {
    all: all,
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

    async delete(id: string) {
      all.value = all.value.filter((movie) => movie.id !== id)

      await api.movie.delete(id)
    },

    async update(id: string, data: MovieUpdate) {
      const saved = await api.movie.patch(id, data)
      const existed = all.value.find((movie) => movie.id === id)

      // The server owns `poster`/`posterSource`; taking its answer avoids showing a stale path.
      if (existed) {
        Object.assign(existed, saved)
      }
    },

    /** Drops the stored file; the next render downloads it again. */
    async redownloadPoster(id: string) {
      const saved = await api.poster.redownload(id)
      const existed = all.value.find((movie) => movie.id === id)

      if (existed) {
        Object.assign(existed, saved)
      }
    },

    async markAsViewed(id: string, date: string, rating: number, comment) {
      const existed = all.value.find((movie) => movie.id === id)

      if (existed) {
        Object.assign(existed, { seen: date, seenRating: rating, seenComment: comment })
      }

      await api.movie.markAsViewed(id, date, rating, comment)
    },

    async removeMovieView(id: string) {
      const existed = all.value.find((movie) => movie.id === id)

      if (existed) {
        existed.seen = null
      }

      await api.movie.removeMovieView(id)
    },

    async togglePrivate(id: string) {
      const existed = all.value.find((movie) => movie.id === id)

      if (existed) {
        const { user } = useAuth()
        existed.private = !existed.private

        await api.movie.patch(id, { private: existed.private, userId: user?.id || null })
      }
    },

    async refreshData(id: string) {
      const existed = all.value.find((item) => item.id === id)

      if (!existed?.extId || !isOmdb(existed)) {
        return
      }

      const data = await api.search.byId(existed.extId, 'omdb')
      const extra = { ...existed.extra }

      if (isOmdb(data)) {
        if (data.extra.Actors && isOmdbString(data.extra.Actors)) {
          extra.Actors = data.extra.Actors
        }
        if (data.extra.Runtime && isOmdbString(data.extra.Runtime)) {
          extra.Runtime = data.extra.Runtime
        }
      }
      const toRefresh = {
        title: data.title || existed.title,
        rating: data.rating || existed.rating,
        year: data.year || existed.year,
        // A new remote URL invalidates the stored file; the server unlinks it and downloads again.
        poster: data.poster || existed.posterSource || existed.poster,
        genre: data.genre || existed.genre,
        extra,
      }

      const saved = await api.movie.patch(id, toRefresh)

      Object.assign(existed, saved)
    },
  }
})
