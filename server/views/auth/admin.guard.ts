import { Elysia } from 'elysia'
import { getSession } from './session'

export const adminGuard = new Elysia({ name: 'admin guard' })
  // Check only role
  .derive({ as: 'scoped' }, async ({ cookie, status }) => {
    const { user } = await getSession(cookie)

    if (user?.role !== 'admin') return status(401)

    return { user }
  })
