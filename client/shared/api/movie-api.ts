import type { Movie, MovieCreate, MovieUpdate } from '@/server/domain'
import { http } from './http'

export type { Movie, MovieCreate, MovieUpdate }

const v1 = http.url('/v1/movie')

export const movie = {
  create: (body: MovieCreate) => v1.post(body).json<Movie>(),
  getAll: () => v1.get().json<Movie[]>(),
  byId: (id: string) => v1.get('/' + id).json<Movie>(),
  update: (id: string, data: MovieUpdate) =>
    v1
      .url('/' + id)
      .put(data)
      .text(),
}
