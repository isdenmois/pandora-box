import { auth } from '@server/app'
import { sessionRepository } from '@server/infra'
import { errorMessage } from '@server/shared'
import { type AppEnv, authCookie, getSession } from '@server/views/auth'
import { Hono } from 'hono'
import { badRequest } from '../error'
import { vjson } from '../validate'
import { loginBody } from './auth.contract'

export const authController = new Hono<AppEnv>()
  .post('/login', vjson(loginBody), async (c) => {
    try {
      const activeSession = await getSession(c)

      if (activeSession.user) {
        return c.json(activeSession.user, 200)
      }

      const { session, user } = await auth.login(c.req.valid('json').username, c.req.valid('json').password)

      authCookie.setSession(c, session)

      return c.json(user, 200)
    } catch (error) {
      return badRequest(c, errorMessage(error))
    }
  })
  .post('/logout', async (c) => {
    const sessionId = authCookie.getSessionId(c)

    if (sessionId) {
      authCookie.deleteSession(c)

      await sessionRepository.delete(sessionId)
    }

    return c.json({}, 200)
  })
