import Elysia from 'elysia'
import { authGuard } from '../auth/guard'

export const userApi = new Elysia({ prefix: '/v1/user' })
  .use(authGuard)
  // get current user
  .get('/current', ({ user }) => user)
