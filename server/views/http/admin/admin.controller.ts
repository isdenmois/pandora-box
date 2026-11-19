import { admin, offsiteUC } from '@server/app'
import {
  attributionRepository,
  backupRepository,
  importRepository,
  movieRepository,
  OFFSITE_RETENTION,
  posterRepository,
  seriesRepository,
  userRepository,
} from '@server/infra'
import { errorMessage } from '@server/shared'
import { type AppEnv, requireAdmin } from '@server/views/auth'
import { Hono } from 'hono'
import { respond } from '../backup-offsite/respond'
import { conflict, internal, invalid, unavailable } from '../error'
import { vjson } from '../validate'
import { BackupRestoreBody, ImportBody, ReassignAttributionBody, RegisterUserBody } from './admin.contract'

/** Ids that still have a row; anything else on disk is an orphan. */
async function knownPosterIds(): Promise<Set<string>> {
  const [movies, series] = await Promise.all([movieRepository.allIds(), seriesRepository.allIds()])

  return new Set([...movies, ...series])
}

export const adminController = new Hono<AppEnv>()
  .use(requireAdmin)
  .post('/register', vjson(RegisterUserBody), async (c) => {
    try {
      const { username, password } = c.req.valid('json')

      await admin.registerUser(username, password)
    } catch (error) {
      return internal(c, errorMessage(error))
    }

    return c.json({ ok: true }, 201)
  })
  .get('/backup', async (c) => c.json(await backupRepository.create(), 200))
  .post('/backup', vjson(BackupRestoreBody), async (c) => {
    // The restore payload is a whole backup tree; its shape is checked table by table.
    await backupRepository.restore(c.req.valid('json') as Parameters<typeof backupRepository.restore>[0])

    return c.body(null, 200)
  })
  // The admin half of the offsite pair: same snapshot, but authenticated by the session cookie and
  // able to report what is already stored. The cron uses the bearer route in `/backup-offsite`.
  .get('/backup/offsite', async (c) => {
    const keys = await offsiteUC.list()

    return keys
      ? c.json({ keys, retention: OFFSITE_RETENTION }, 200)
      : unavailable(c, 'Offsite backup is not configured')
  })
  .post('/backup/offsite', async (c) => respond(c, await offsiteUC.upload()))
  // Only shared rows: a private row belongs to its creator, so an admin never sees or moves one.
  .get('/attribution', async (c) => c.json(await attributionRepository.getGlobal(), 200))
  .patch('/attribution', vjson(ReassignAttributionBody), async (c) => {
    const body = c.req.valid('json')
    const movies = body.movies ?? []
    const series = body.series ?? []

    if (!movies.length && !series.length) {
      return invalid(c, 'No records selected')
    }

    if (!(await userRepository.exists(body.createdBy))) {
      return invalid(c, 'Unknown creator')
    }

    const result = await attributionRepository.reassign({ movies, series, createdBy: body.createdBy })

    if (!result.ok) {
      return conflict(c, 'One or more records are private or missing')
    }

    return c.json({ updated: result.updated }, 200)
  })
  .post('/import', vjson(ImportBody), async (c) =>
    c.json(await importRepository.import(c.get('user').id, c.req.valid('json')), 200),
  )
  .get('/import', (c) => c.json(importRepository.status(), 200))
  // Deletes poster files that no row references and reports how many went. The client confirms
  // first; there is no dry run because the caller sees the count only after the delete.
  .delete('/images/orphans', async (c) => {
    const removed = await posterRepository.removeOrphans(await knownPosterIds())

    return c.json({ removed }, 200)
  })
