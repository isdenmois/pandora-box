import Elysia, { status, StatusMap } from 'elysia'
import { toString } from '@/shared'
import { admin } from '@/app'
import { adminGuard } from '@/views/auth'
import { RegisterUserBody } from './admin.contract'

export const adminController = new Elysia({
  prefix: '/v1/admin',
  detail: {
    tags: ['admin'],
  },
})
  .use(adminGuard)
  .post(
    '/register',
    async ({ body }) => {
      try {
        await admin.registerUser(body.username, body.password)
      } catch (error) {
        throw status(500, { message: toString(error) })
      }

      return status(StatusMap.Created, { ok: true })
    },
    {
      body: RegisterUserBody,
      detail: {
        description: 'Registers a new user',
      },
    },
  )
