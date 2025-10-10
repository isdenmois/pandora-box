import type { Movie } from '../../../server/domain/entities'
import { http } from './http'

export type { Movie }

export type MovieCreate = Omit<Movie, 'id'>

const v1 = http.url('/v1/movie')

export const movie = {
  create: (body: MovieCreate) => v1.post(body).json<Movie>(),
  getAll: () => v1.get().json<Movie[]>(),
}
