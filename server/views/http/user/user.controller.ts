import { userRepository } from '@server/infra'
import { type AppEnv, requireAuth } from '@server/views/auth'
import { Hono } from 'hono'

export const userController = new Hono<AppEnv>()
  .use(requireAuth)
  // Public directory: names power attribution labels and the recommender picker.
  .get('/', async (c) => c.json(await userRepository.list(), 200))
  // get current user
  .get('/current', (c) => c.json(c.get('user'), 200))
