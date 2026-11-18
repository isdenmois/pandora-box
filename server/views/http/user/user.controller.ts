import Elysia from 'elysia'
import { userRepository } from '@/infra'
import { authGuard } from '@/views/auth'

export const userController = new Elysia({
  prefix: '/v1/user',
  detail: {
    tags: ['user'],
  },
})
  .use(authGuard)
  // Public directory: names power attribution labels and the recommender picker.
  .get('', () => userRepository.list())
  // get current user
  .get('/current', ({ user }) => user)
