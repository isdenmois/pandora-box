import type { MovieAppType } from '@server/views/http/app-type'
import type { Movie, MovieCreate, MovieUpdate, MovieView } from '@/server/domain'
import { createClient } from './client'
import { ensure, unwrap } from './request'

export type { Movie, MovieCreate, MovieUpdate, MovieView }

const movies = createClient<MovieAppType>('/api/v1/movie')

export const movie = {
  create: async (body: MovieCreate) => unwrap(await movies.index.$post({ json: body })),
  getAll: async () => unwrap(await movies.index.$get()),
  byId: async (id: string) => unwrap(await movies[':id'].$get({ param: { id } })),
  delete: async (id: string) => {
    await ensure(await movies[':id'].$delete({ param: { id } }))
  },
  // The server returns the stored row, which is how the localized `poster` path reaches the client.
  patch: async (id: string, data: Partial<MovieUpdate>) =>
    unwrap(await movies[':id'].$patch({ param: { id }, json: data })),
  /** Fields and a picked image file in one request; the file wins over `data.poster`. */
  savePoster: async (id: string, data: Partial<MovieUpdate>, file: File) =>
    unwrap(
      await movies[':id'].poster.$patch({
        param: { id },
        form: { data: JSON.stringify(data), file },
      }),
    ),
  getViews: async () => unwrap(await movies.views.$get()),
  markAsViewed: async (movieId: string, date: string, rating: number, comment: string) =>
    unwrap(await movies[':id'].viewed.$post({ param: { id: movieId }, json: { date, rating, comment } })),
  removeMovieView: async (movieId: string) => {
    await ensure(await movies[':id'].view.$delete({ param: { id: movieId } }))
  },
}
