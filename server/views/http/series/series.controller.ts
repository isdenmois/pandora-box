import Elysia from 'elysia'
import { createSeriesBody } from './series.contract'
import { seriesRepository } from '@/infra'

export const seriesController = new Elysia({
  prefix: '/v1/series',
  detail: {
    tags: ['series'],
  },
})
  .post(
    '',
    async ({ body }) => {
      return await seriesRepository.create(body)
    },
    { body: createSeriesBody },
  )
  .get('', () => {
    return seriesRepository.getAll()
  })
