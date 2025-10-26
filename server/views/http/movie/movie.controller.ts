import Elysia from 'elysia'
import { movieRepository } from '@/infra'
import { authGuard } from '@/views/auth'
import { createMovieBody, markMovieViewedBody, patchMovieBody, updateMovieBody } from './movie.contract'

export const movieController = new Elysia({
  prefix: '/v1/movie',
  detail: {
    tags: ['movie'],
  },
})
  .use(authGuard)
  .post('', async ({ body }) => await movieRepository.create(body), { body: createMovieBody })
  .get(':id', ({ params: { id } }) => movieRepository.byId(id))
  .put(':id', ({ params: { id }, body }) => movieRepository.update(id, body), { body: updateMovieBody })
  .patch(':id', ({ params: { id }, body }) => movieRepository.update(id, body), { body: patchMovieBody })
  .post(
    '/:id/viewed',
    ({ params: { id }, user, body: { date, rating } }) => movieRepository.markAsViewed(id, user.id, date, rating),
    { body: markMovieViewedBody },
  )
  .delete(':id', ({ params: { id } }) => movieRepository.delete(id))
  .delete('/view/:id', ({ params: { id } }) => movieRepository.removeView(id))
  .delete('/:id/view', ({ params: { id } }) => movieRepository.removeMovieView(id))
  .get('', ({ user }) => movieRepository.getAll(user.id))
  .get('views', ({ user }) => movieRepository.getViews(user.id))
