import Elysia from 'elysia'
import { env, movieRepository, posterRepository } from '@/infra'
import { authGuard } from '@/views/auth'
import { createPosterUploadHandler, parseJsonPart } from '../poster/poster-upload'
import { posterUploadBody } from '../poster/poster-upload.contract'
import { createMovieBody, markMovieViewedBody, patchMovieBody } from './movie.contract'

const uploadPoster = createPosterUploadHandler({
  records: movieRepository,
  files: posterRepository,
  parseFields: parseJsonPart(patchMovieBody),
})

export const movieController = new Elysia({
  prefix: '/v1/movie',
  detail: {
    tags: ['movie'],
  },
})
  .use(authGuard)
  .post('', async ({ body }) => await movieRepository.create(body), { body: createMovieBody })
  .get(':id', ({ params: { id } }) => movieRepository.byId(id))
  // The edit form saves the fields and a picked image file in one request.
  .patch('/:id/poster', uploadPoster, { body: posterUploadBody(env.IMAGE_MAX_BYTES) })
  .patch(':id', ({ params: { id }, body }) => movieRepository.update(id, body), { body: patchMovieBody })
  .post(
    '/:id/viewed',
    ({ params: { id }, user, body: { date, rating, comment } }) =>
      movieRepository.markAsViewed(id, user.id, date, rating, comment),
    { body: markMovieViewedBody },
  )
  .delete(':id', ({ params: { id } }) => movieRepository.delete(id))
  .delete('/view/:id', ({ params: { id } }) => movieRepository.removeView(id))
  .delete('/:id/view', ({ params: { id } }) => movieRepository.removeMovieView(id))
  .get('', ({ user }) => movieRepository.getAll(user.id))
  .get('views', ({ user }) => movieRepository.getViews(user.id))
