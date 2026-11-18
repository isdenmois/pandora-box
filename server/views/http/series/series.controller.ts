import Elysia from 'elysia'
import { env, posterRepository, seriesRepository } from '@/infra'
import { authGuard } from '@/views/auth'
import { createPosterUploadHandler, parseJsonPart } from '../poster/poster-upload'
import { posterUploadBody } from '../poster/poster-upload.contract'
import { createSeriesBody, markSeriesViewedBody, patchSeriesBody } from './series.contract'

const uploadPoster = createPosterUploadHandler({
  records: seriesRepository,
  files: posterRepository,
  parseFields: parseJsonPart(patchSeriesBody),
})

export const seriesController = new Elysia({
  prefix: '/v1/series',
  detail: {
    tags: ['series'],
  },
})
  .use(authGuard)
  .post('', async ({ body }) => await seriesRepository.create(body), { body: createSeriesBody })
  .get(':id', ({ params: { id } }) => seriesRepository.byId(id))
  // The edit form saves the fields and a picked image file in one request.
  .patch('/:id/poster', uploadPoster, { body: posterUploadBody(env.IMAGE_MAX_BYTES) })
  .patch(':id', ({ params: { id }, body }) => seriesRepository.update(id, body), { body: patchSeriesBody })
  .post(
    '/:id/viewed',
    ({ params: { id }, user, body: { date, rating, comment } }) =>
      seriesRepository.markAsViewed(id, user.id, date, rating, comment),
    { body: markSeriesViewedBody },
  )
  .delete(':id', ({ params: { id } }) => seriesRepository.delete(id))
  .delete('/view/:id', ({ params: { id } }) => seriesRepository.removeView(id))
  .delete('/:id/view', ({ params: { id } }) => seriesRepository.removeSeriesView(id))
  .get('', ({ user }) => seriesRepository.getAll(user.id))
  .get('views', ({ user }) => seriesRepository.getViews(user.id))
