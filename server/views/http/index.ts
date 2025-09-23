import Elysia from 'elysia'
import { authController } from './auth'
import { adminController } from './admin'
import { searchController } from './search'
import { userController } from './user'

export const httpControllers = new Elysia({ prefix: '/api' })
  .use(authController)
  .use(adminController)
  .use(searchController)
  .use(userController)
