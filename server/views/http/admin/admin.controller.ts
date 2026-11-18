import Elysia, { StatusMap, status } from 'elysia'
import { admin } from '@/app'
import {
  attributionRepository,
  backupRepository,
  importRepository,
  movieRepository,
  posterRepository,
  seriesRepository,
  userRepository,
} from '@/infra'
import { errorMessage } from '@/shared'
import { adminGuard } from '@/views/auth'
import { BackupRestoreBody, ImportBody, ReassignAttributionBody, RegisterUserBody } from './admin.contract'

/** Ids that still have a row; anything else on disk is an orphan. */
async function knownPosterIds(): Promise<Set<string>> {
  const [movies, series] = await Promise.all([movieRepository.allIds(), seriesRepository.allIds()])

  return new Set([...movies, ...series])
}

export const adminController = new Elysia({
  prefix: '/v1/admin',
  detail: {
    tags: ['admin'],
  },
})
  .use(adminGuard)
  .post(
    '/register',
    async ({ body }) => {
      try {
        await admin.registerUser(body.username, body.password)
      } catch (error) {
        throw status(500, { message: errorMessage(error) })
      }

      return status(StatusMap.Created, { ok: true })
    },
    {
      body: RegisterUserBody,
      detail: {
        description: 'Registers a new user',
      },
    },
  )
  .get('/backup', () => backupRepository.create())
  .post('/backup', ({ body }) => backupRepository.restore(body), { body: BackupRestoreBody })
  // Only shared rows: a private row belongs to its creator, so an admin never sees or moves one.
  .get('/attribution', () => attributionRepository.getGlobal())
  .patch(
    '/attribution',
    async ({ body, status }) => {
      const movies = body.movies ?? []
      const series = body.series ?? []

      if (!movies.length && !series.length) {
        return status(422, { message: 'No records selected' })
      }

      if (!(await userRepository.exists(body.createdBy))) {
        return status(422, { message: 'Unknown creator' })
      }

      const result = await attributionRepository.reassign({ movies, series, createdBy: body.createdBy })

      if (!result.ok) {
        return status(409, { message: 'One or more records are private or missing' })
      }

      return { updated: result.updated }
    },
    { body: ReassignAttributionBody },
  )
  .post('/import', ({ user, body }) => importRepository.import(user.id, body), { body: ImportBody })
  .get('/import', () => importRepository.status())
  // Deletes poster files that no row references and reports how many went. The client confirms
  // first; there is no dry run because the caller sees the count only after the delete.
  .delete('/images/orphans', async () => {
    const removed = await posterRepository.removeOrphans(await knownPosterIds())

    return { removed }
  })
