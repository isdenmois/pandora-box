import { api, type Movie, type MovieCreate } from '@/shared/api'

class MoviesModel {
  all = $state.raw<Movie[]>([])
  isLoading = $state(false)

  async refresh() {
    this.isLoading = true

    try {
      this.all = await api.movie.getAll()
    } finally {
      this.isLoading = false
    }
  }

  async create(data: MovieCreate) {
    const movie = await api.movie.create(data)

    this.all = [...this.all, movie]
  }
}

export const movies = new MoviesModel()
