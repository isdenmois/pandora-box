import Elysia from 'elysia'
import { seriesRepository } from '@/infra'
import { authGuard } from '@/views/auth'
import { createSeriesBody, markSeriesViewedBody, updateSeriesBody } from './series.contract'

export const seriesController = new Elysia({
  prefix: '/v1/series',
  detail: {
    tags: ['series'],
  },
})
  .use(authGuard)
  .post(
    '',
    async ({ body }) => {
      return await seriesRepository.create(body)
    },
    { body: createSeriesBody },
  )
  .get(':id', ({ params: { id } }) => seriesRepository.byId(id))
  .put(':id', ({ params: { id }, body }) => seriesRepository.update(id, body), { body: updateSeriesBody })
  .post(
    '/:id/viewed',
    ({ params: { id }, user, body: { date, rating } }) => seriesRepository.markAsViewed(id, user.id, date, rating),
    { body: markSeriesViewedBody },
  )
  .delete(':id', ({ params: { id } }) => seriesRepository.delete(id))
  .delete('/view/:id', ({ params: { id } }) => seriesRepository.removeView(id))
  .delete('/:id/view', ({ params: { id } }) => seriesRepository.removeSeriesView(id))
  .get('', () => seriesRepository.getAll())
  .get('views', ({ user }) => seriesRepository.getViews(user.id))
