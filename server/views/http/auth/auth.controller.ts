import { Elysia, status } from 'elysia'
import { toString } from '@/shared'
import { sessionRepository } from '@/infra'
import { auth } from '@/app'
import { authCookie, getSession } from '@/views/auth'
import { loginBody } from './auth.contract'

export const authController = new Elysia({
  prefix: '/auth',
  detail: {
    tags: ['auth'],
  },
})
  .post(
    '/login',
    async ({ body, cookie }) => {
      try {
        const activeSession = await getSession(cookie)

        if (activeSession.user) {
          return activeSession.user
        }

        const { session, user } = await auth.login(body.username, body.password)

        authCookie.setSession(cookie, session)

        return user
      } catch (error) {
        throw status(400, { message: toString(error) })
      }
    },
    {
      body: loginBody,
    },
  )
  .post('/logout', async ({ cookie }) => {
    const sessionId = authCookie.getSessionId(cookie)

    if (sessionId) {
      authCookie.deleteSession(cookie)

      await sessionRepository.delete(sessionId)
    }

    return {}
  })
