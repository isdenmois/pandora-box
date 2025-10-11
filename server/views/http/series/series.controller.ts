import Elysia from 'elysia'
import { seriesRepository } from '@/infra'
import { authGuard } from '@/views/auth'
import { createSeriesBody, updateSeriesBody } from './series.contract'

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
  .get('', () => {
    return seriesRepository.getAll()
  })
