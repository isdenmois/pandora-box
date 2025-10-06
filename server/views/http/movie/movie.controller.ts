import Elysia from 'elysia'
import { movieRepository } from '@/infra'
import { authGuard } from '@/views/auth'
import { createMovieBody } from './movie.contract'

export const movieController = new Elysia({
  prefix: '/v1/movie',
  detail: {
    tags: ['movie'],
  },
})
  .use(authGuard)
  .post(
    '',
    async ({ body }) => {
      return await movieRepository.create(body)
    },
    { body: createMovieBody },
  )
  .get('', () => {
    return movieRepository.getAll()
  })
