import Elysia, { status, StatusMap, t } from 'elysia'
import { adminService } from './admin.service'
import { adminGuard } from '../auth/guard'
import { toString } from '../../shared/to-string'

export const adminApi = new Elysia({ prefix: '/v1/admin' })
  .use(adminGuard)
  // register another user
  .post(
    '/register',
    async ({ body }) => {
      try {
        await adminService.register(body.username, body.password)
      } catch (error) {
        throw status(500, { message: toString(error) })
      }

      return status(StatusMap.Created, { ok: true })
    },
    {
      body: t.Object({ username: t.String(), password: t.String() }),
    },
  )
