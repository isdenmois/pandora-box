import { Elysia } from 'elysia'
import { offsiteUC } from '@/app'
import { backupTokenGuard } from '@/views/auth'
import { respond } from './respond'

/**
 * Machine route for the host cron: `POST /api/v1/backup/offsite` with `Authorization: Bearer`.
 * The admin equivalent (cookie, plus the status listing) lives in `adminController`.
 */
export const offsiteController = new Elysia({ prefix: '/v1', detail: { tags: ['backup'] } })
  .use(backupTokenGuard)
  .post('/backup/offsite', async () => respond(await offsiteUC.upload()), {
    detail: {
      description: 'Snapshots the database into Firebase Realtime Database',
    },
  })
