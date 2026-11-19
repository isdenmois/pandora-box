import { Hono } from 'hono'
import type { AppEnv } from '../auth'
import { adminController } from './admin'
import { authController } from './auth'
import { offsiteController } from './backup-offsite'
import { errorBody } from './error'
import { imageController } from './image'
import { movieController } from './movie'
import { posterController } from './poster'
import { searchController } from './search'
import { seriesController } from './series'
import { userController } from './user'

/** Every controller is registered in one chain; statement-form registration is invisible to `hc`. */
export const app = new Hono<AppEnv>()
  .onError((error, c) => {
    console.error(error)

    return c.json(errorBody('internal', 'Internal server error'), 500)
  })
  .notFound((c) => c.json(errorBody('not_found', 'Not found'), 404))
  .route('/api/auth', authController)
  .route('/api/v1/user', userController)
  .route('/api/v1/search', searchController)
  .route('/api/v1/movie', movieController)
  .route('/api/v1/series', seriesController)
  .route('/api/v1/poster', posterController)
  .route('/api/v1/admin', adminController)
  .route('/api/v1/backup', offsiteController) // token-guarded, never mounted under /admin
  .route('/', imageController) // root, outside /api

export type { ErrorBody } from './error'
