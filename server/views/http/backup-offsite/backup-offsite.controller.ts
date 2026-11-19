import { offsiteUC } from '@server/app'
import { backupTokenGuard } from '@server/views/auth'
import { Hono } from 'hono'
import { respond } from './respond'

/**
 * Machine route for the host cron: `POST /api/v1/backup/offsite` with `Authorization: Bearer`.
 * The admin equivalent (cookie, plus the status listing) lives in `adminController`.
 */
export const offsiteController = new Hono()
  .use(backupTokenGuard)
  .post('/offsite', async (c) => respond(c, await offsiteUC.upload()))
