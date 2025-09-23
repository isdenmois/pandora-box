import Elysia from 'elysia'
import { authGuard } from '../../auth'

export const userController = new Elysia({
  prefix: '/v1/user',
  detail: {
    tags: ['user'],
  },
})
  .use(authGuard)
  // get current user
  .get('/current', ({ user }) => user)
