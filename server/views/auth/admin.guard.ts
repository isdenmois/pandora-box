import { createMiddleware } from 'hono/factory'
import { unauthorized } from '../http/error'
import { type AppEnv, getSession } from './session'

export const requireAdmin = createMiddleware<AppEnv>(async (c, next) => {
  const { user } = await getSession(c)

  if (user?.role !== 'admin') {
    return unauthorized(c)
  }

  c.set('user', user)

  await next()
})
