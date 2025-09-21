import { Elysia, status } from 'elysia'
import { toString } from '../../shared/to-string'
import * as AuthModel from './model'
import { Auth } from './service'
import { deleteSessionTokenCookie, getSession, invalidateSession, setSessionTokenCookie } from './auth'

export const auth = new Elysia({ prefix: '/auth' })
  .post(
    '/login',
    async ({ body, cookie }) => {
      try {
        const activeSession = await getSession(cookie)

        if (activeSession.user) {
          return activeSession.user
        }

        const { session, user } = await Auth.login(body)

        setSessionTokenCookie(cookie, session)

        return user
      } catch (error) {
        throw status(400, { message: toString(error) })
      }
    },
    {
      body: AuthModel.signInBody,
    },
  )
  .post('/logout', async ({ cookie }) => {
    const { session } = await getSession(cookie)

    if (session?.id) {
      await invalidateSession(session.id)
    }

    deleteSessionTokenCookie(cookie)

    return {}
  })
