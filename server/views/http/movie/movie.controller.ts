import Elysia from 'elysia'
import { isValidRecommender } from '@/app'
import { canAccess } from '@/domain'
import { env, movieRepository, posterRepository } from '@/infra'
import { authGuard } from '@/views/auth'
import { createPosterUploadHandler, parseJsonPart } from '../poster/poster-upload'
import { posterUploadBody } from '../poster/poster-upload.contract'
import { createMovieBody, markMovieViewedBody, patchMovieBody } from './movie.contract'

const uploadPoster = createPosterUploadHandler({
  records: movieRepository,
  files: posterRepository,
  parseFields: parseJsonPart(patchMovieBody),
  async authorize(id, userId) {
    const row = await movieRepository.byId(id)

    return !!row && canAccess(row, userId)
  },
  async validateFields(id, fields) {
    if (fields.recommendedBy === undefined) {
      return true
    }

    const row = await movieRepository.byId(id)

    return !!row && (await isValidRecommender(fields.recommendedBy, row.createdBy))
  },
})

/** A private row answers 404 to everyone but its creator, so its existence does not leak. */
const visible = async (id: string, userId: string) => {
  const row = await movieRepository.byId(id)

  return row && canAccess(row, userId) ? row : null
}

export const movieController = new Elysia({
  prefix: '/v1/movie',
  detail: {
    tags: ['movie'],
  },
})
  .use(authGuard)
  .post(
    '',
    async ({ body, user, status }) => {
      if (!(await isValidRecommender(body.recommendedBy, user.id))) {
        return status(422, { message: 'Unknown or invalid recommender' })
      }

      return await movieRepository.create(body, user.id)
    },
    { body: createMovieBody },
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

      return await movieRepository.update(id, body, undefined, user.id)
    },
    { body: patchMovieBody },
  )
  .post(
    '/:id/viewed',
    async ({ params: { id }, user, body: { date, rating, comment }, status }) => {
      const row = await visible(id, user.id)

      if (!row) {
        return status(404, { message: 'Not found' })
      }

      return await movieRepository.markAsViewed(id, user.id, date, rating, comment)
    },
    { body: markMovieViewedBody },
  )
  .delete(':id', async ({ params: { id }, user, status }) => {
    const row = await visible(id, user.id)

    if (!row) {
      return status(404, { message: 'Not found' })
    }

    return await movieRepository.delete(id)
  })
  .delete('/:id/view', async ({ params: { id }, user, status }) => {
    const row = await visible(id, user.id)

    if (!row) {
      return status(404, { message: 'Not found' })
    }

    return await movieRepository.removeMovieView(id)
  })
  .get('', ({ user }) => movieRepository.getAll(user.id))
  .get('views', ({ user }) => movieRepository.getViews(user.id))
