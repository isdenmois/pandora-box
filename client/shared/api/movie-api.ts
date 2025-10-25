import type { MovieView, Movie, MovieCreate, MovieUpdate } from '@/server/domain'
import { http } from './http'

export type { Movie, MovieView, MovieCreate, MovieUpdate }

const v1 = http.url('/v1/movie')

export const movie = {
  create: (body: MovieCreate) => v1.post(body).json<Movie>(),
  getAll: () => v1.get().json<Movie[]>(),
  byId: (id: string) => v1.get('/' + id).json<Movie>(),
  delete: (id: string) =>
    v1
      .url('/' + id)
      .delete()
      .text(),
  update: (id: string, data: MovieUpdate) =>
    v1
      .url('/' + id)
      .put(data)
      .text(),
  getViews: () => v1.get('/views').json<MovieView[]>(),
  markAsViewed: (movieId: string, date: string, rating: number) =>
    v1.url(`/${movieId}/viewed`).post({ date, rating }).json<MovieView>(),
  removeMovieView: (movieId: string) => v1.url(`/${movieId}/view`).delete().text(),
}
