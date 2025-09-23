import { Elysia } from 'elysia'
import { getSession } from './session'

export const authGuard = new Elysia({ name: 'auth guard' })
  // Check if user session exist
  .derive({ as: 'scoped' }, async ({ cookie, status }) => {
    const { user } = await getSession(cookie)

    if (!user?.id) return status(401)

    return { user }
  })
