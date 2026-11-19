import { isValidRecommender } from '@server/app'
import { canAccess } from '@server/domain'
import { env, posterRepository, seriesRepository } from '@server/infra'
import { type AppEnv, requireAuth } from '@server/views/auth'
import { Hono } from 'hono'
import { invalid, notFound } from '../error'
import { createPosterUploadHandler, parseJsonPart } from '../poster/poster-upload'
import { posterUploadBody } from '../poster/poster-upload.contract'
import { vform, vjson } from '../validate'
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

export const seriesController = new Hono<AppEnv>()
  .use(requireAuth)
  // `/views` must be registered before `/:id`; Hono matches in registration order.
  .get('/views', async (c) => c.json(await seriesRepository.getViews(c.get('user').id), 200))
  .get('/', async (c) => c.json(await seriesRepository.getAll(c.get('user').id), 200))
  .post('/', vjson(createSeriesBody), async (c) => {
    const body = c.req.valid('json')
    const user = c.get('user')

    if (!(await isValidRecommender(body.recommendedBy, user.id))) {
      return invalid(c, 'Unknown or invalid recommender')
    }

    return c.json(await seriesRepository.create(body, user.id), 200)
  })
  .get('/:id', async (c) => {
    const row = await visible(c.req.param('id'), c.get('user').id)

    return row ? c.json(row, 200) : notFound(c)
  })
  // The edit form saves the fields and a picked image file in one request.
  .patch('/:id/poster', vform(posterUploadBody(env.IMAGE_MAX_BYTES)), (c) => uploadPoster(c, c.req.valid('form')))
  .patch('/:id', vjson(patchSeriesBody), async (c) => {
    const id = c.req.param('id')
    const body = c.req.valid('json')
    const user = c.get('user')
    const row = await visible(id, user.id)

    if (!row) {
      return notFound(c)
    }

    if (body.recommendedBy !== undefined && !(await isValidRecommender(body.recommendedBy, row.createdBy))) {
      return invalid(c, 'Unknown or invalid recommender')
    }

    const updated = await seriesRepository.update(id, body, undefined, user.id)

    return updated ? c.json(updated, 200) : notFound(c)
  })
  .post('/:id/viewed', vjson(markSeriesViewedBody), async (c) => {
    const id = c.req.param('id')
    const user = c.get('user')
    const row = await visible(id, user.id)

    if (!row) {
      return notFound(c)
    }

    const { date, rating, comment } = c.req.valid('json')

    return c.json(await seriesRepository.markAsViewed(id, user.id, date, rating, comment), 200)
  })
  .delete('/:id', async (c) => {
    const id = c.req.param('id')
    const row = await visible(id, c.get('user').id)

    if (!row) {
      return notFound(c)
    }

    await seriesRepository.delete(id)

    return c.body(null, 200)
  })
  .delete('/:id/view', async (c) => {
    const id = c.req.param('id')
    const row = await visible(id, c.get('user').id)

    if (!row) {
      return notFound(c)
    }

    await seriesRepository.removeSeriesView(id)

    return c.body(null, 200)
  })
