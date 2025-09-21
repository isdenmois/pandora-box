import { Elysia } from 'elysia'
import { getSession } from './auth'

export const authGuard = new Elysia({ name: 'auth guard' })
  // Check if user session exist
  .derive({ as: 'scoped' }, async ({ cookie, status }) => {
    const { user } = await getSession(cookie)

    if (!user?.id) return status(401)

    return { user }
  })

export const adminGuard = new Elysia({ name: 'admin guard' })
  // Check only role
  .derive({ as: 'scoped' }, async ({ cookie, status }) => {
    const { user } = await getSession(cookie)

    if (user?.role !== 'admin') return status(401)

    return { user }
  })
