import Elysia, { status, StatusMap } from 'elysia'
import { admin } from '@/app'
import { backupRepository, importRepository } from '@/infra'
import { toString } from '@/shared'
import { adminGuard } from '@/views/auth'
import { BackupRestoreBody, ImportBody, RegisterUserBody } from './admin.contract'

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
  .get('/backup', () => backupRepository.create())
  .post('/backup', ({ body }) => backupRepository.restore(body), { body: BackupRestoreBody })
  .post('/import', ({ body }) => importRepository.import(body), { body: ImportBody })
  .get('/import', () => importRepository.status())
