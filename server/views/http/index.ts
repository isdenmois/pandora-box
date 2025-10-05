import Elysia from 'elysia'
import { adminController } from './admin'
import { authController } from './auth'
import { movieController } from './movie'
import { searchController } from './search'
import { seriesController } from './series'
import { userController } from './user'

export const httpControllers = new Elysia({ prefix: '/api' })
  .use(authController)
  .use(adminController)
  .use(movieController)
  .use(searchController)
  .use(seriesController)
  .use(userController)
