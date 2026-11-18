import Elysia from 'elysia'
import { adminController } from './admin'
import { authController } from './auth'
import { offsiteController } from './backup-offsite'
import { imageController } from './image'
import { movieController } from './movie'
import { posterController } from './poster'
import { searchController } from './search'
import { seriesController } from './series'
import { userController } from './user'

export const httpControllers = new Elysia({ prefix: '/api' })
  .use(authController)
  .use(adminController)
  .use(offsiteController)
  .use(movieController)
  .use(posterController)
  .use(searchController)
  .use(seriesController)
  .use(userController)

/** Served at the root so the stored `poster` path is the same URL in dev and behind nginx. */
export const imageControllers = new Elysia().use(imageController)
