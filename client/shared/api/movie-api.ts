import type { Movie, MovieCreate, MovieUpdate, MovieView } from '@/server/domain'
import { http } from './http'

export type { Movie, MovieCreate, MovieUpdate, MovieView }

const v1 = http.url('/v1/movie')

export const movie = {
  create: (body: MovieCreate) => v1.post(body).json<Movie>(),
  getAll: () => v1.get().json<Movie[]>(),
  byId: (id: string) => v1.get(`/${id}`).json<Movie>(),
  delete: (id: string) => v1.url(`/${id}`).delete().text(),
  // The server returns the stored row, which is how the localized `poster` path reaches the client.
  patch: (id: string, data: Partial<MovieUpdate>) => v1.url(`/${id}`).patch(data).json<Movie>(),
  /** Fields and a picked image file in one request; the file wins over `data.poster`. */
  savePoster: (id: string, data: Partial<MovieUpdate>, file: File) => {
    const body = new FormData()
    body.append('data', JSON.stringify(data))
    body.append('file', file)

    return v1.url(`/${id}/poster`).patch(body).json<Movie>()
  },
  getViews: () => v1.get('/views').json<MovieView[]>(),
  markAsViewed: (movieId: string, date: string, rating: number, comment: string) =>
    v1.url(`/${movieId}/viewed`).post({ date, rating, comment }).json<MovieView>(),
  removeMovieView: (movieId: string) => v1.url(`/${movieId}/view`).delete().text(),
}
