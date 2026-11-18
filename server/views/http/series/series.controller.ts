import Elysia from 'elysia'
import { isValidRecommender } from '@/app'
import { canAccess } from '@/domain'
import { env, posterRepository, seriesRepository } from '@/infra'
import { authGuard } from '@/views/auth'
import { createPosterUploadHandler, parseJsonPart } from '../poster/poster-upload'
import { posterUploadBody } from '../poster/poster-upload.contract'
import { createSeriesBody, markSeriesViewedBody, patchSeriesBody } from './series.contract'

const uploadPoster = createPosterUploadHandler({
  records: seriesRepository,
  files: posterRepository,
  parseFields: parseJsonPart(patchSeriesBody),
  async authorize(id, userId) {
    const row = await seriesRepository.byId(id)

    return !!row && canAccess(row, userId)
  },
  async validateFields(id, fields) {
    if (fields.recommendedBy === undefined) {
      return true
    }

    const row = await seriesRepository.byId(id)

    return !!row && (await isValidRecommender(fields.recommendedBy, row.createdBy))
  },
})

/** A private row answers 404 to everyone but its creator, so its existence does not leak. */
const visible = async (id: string, userId: string) => {
  const row = await seriesRepository.byId(id)

  return row && canAccess(row, userId) ? row : null
}

export const seriesController = new Elysia({
  prefix: '/v1/series',
  detail: {
    tags: ['series'],
  },
})
  .use(authGuard)
  .post(
    '',
    async ({ body, user, status }) => {
      if (!(await isValidRecommender(body.recommendedBy, user.id))) {
        return status(422, { message: 'Unknown or invalid recommender' })
      }

      return await seriesRepository.create(body, user.id)
    },
    { body: createSeriesBody },
  )
  .get(':id', async ({ params: { id }, user, status }) => {
    const row = await visible(id, user.id)

    return row ?? status(404, { message: 'Not found' })
  })
  // The edit form saves the fields and a picked image file in one request.
  .patch('/:id/poster', uploadPoster, { body: posterUploadBody(env.IMAGE_MAX_BYTES) })
  .patch(
    ':id',
    async ({ params: { id }, body, user, status }) => {
      const row = await visible(id, user.id)

      if (!row) {
        return status(404, { message: 'Not found' })
      }

      if (body.recommendedBy !== undefined && !(await isValidRecommender(body.recommendedBy, row.createdBy))) {
        return status(422, { message: 'Unknown or invalid recommender' })
      }

      return await seriesRepository.update(id, body, undefined, user.id)
    },
    { body: patchSeriesBody },
  )
  .post(
    '/:id/viewed',
    async ({ params: { id }, user, body: { date, rating, comment }, status }) => {
      const row = await visible(id, user.id)

      if (!row) {
        return status(404, { message: 'Not found' })
      }

      return await seriesRepository.markAsViewed(id, user.id, date, rating, comment)
    },
    { body: markSeriesViewedBody },
  )
  .delete(':id', async ({ params: { id }, user, status }) => {
    const row = await visible(id, user.id)

    if (!row) {
      return status(404, { message: 'Not found' })
    }

    return await seriesRepository.delete(id)
  })
  .delete('/:id/view', async ({ params: { id }, user, status }) => {
    const row = await visible(id, user.id)

    if (!row) {
      return status(404, { message: 'Not found' })
    }

    return await seriesRepository.removeSeriesView(id)
  })
  .get('', ({ user }) => seriesRepository.getAll(user.id))
  .get('views', ({ user }) => seriesRepository.getViews(user.id))
