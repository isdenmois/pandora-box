import { canAccess } from '@server/domain'
import { posterRepository } from '@server/infra'
import { type AppEnv, requireAuth } from '@server/views/auth'
import { Hono } from 'hono'
import { conflict, notFound } from '../error'
import { findPosterRow, type PosterRow } from './poster-record'

export interface PosterControllerDeps {
  findRow: (id: string) => Promise<PosterRow | null>
  remove: (id: string) => Promise<void>
}

/**
 * Drops the stored file and keeps `poster`/`posterSource` as they are, so the next view is a cold
 * miss that downloads again. A private row is invisible to everyone but its creator, matching the
 * movie and series edit routes.
 */
export function createPosterController(deps: PosterControllerDeps) {
  return new Hono<AppEnv>().use(requireAuth).delete('/:id', async (c) => {
    const id = c.req.param('id')
    const row = await deps.findRow(id)

    if (!row || !canAccess(row, c.get('user').id)) {
      return notFound(c)
    }

    // Nothing to re-download from: the row never had a source, so the file is all it has.
    if (!row.posterSource) {
      return conflict(c, 'Poster has no source')
    }

    await deps.remove(id)

    return c.json(row, 200)
  })
}

export const posterController = createPosterController({
  findRow: findPosterRow,
  remove: (id) => posterRepository.remove(id),
})
