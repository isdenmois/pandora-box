import Elysia, { status } from 'elysia'
import { canAccess } from '@/domain'
import { posterRepository } from '@/infra'
import { authGuard } from '@/views/auth'
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
  return new Elysia({
    prefix: '/v1/poster',
    detail: {
      tags: ['poster'],
    },
  })
    .use(authGuard)
    .delete('/:id', async ({ params: { id }, user }) => {
      const row = await deps.findRow(id)

      if (!row || !canAccess(row, user.id)) {
        return status(404, { message: 'Not found' })
      }

      // Nothing to re-download from: the row never had a source, so the file is all it has.
      if (!row.posterSource) {
        return status(409, { message: 'Poster has no source' })
      }

      await deps.remove(id)

      return row
    })
}

export const posterController = createPosterController({
  findRow: findPosterRow,
  remove: (id) => posterRepository.remove(id),
})
