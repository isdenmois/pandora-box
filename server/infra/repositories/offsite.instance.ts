import { env } from '@/infra/env'
import { createAccessToken, decodeServiceAccount } from '../firebase/service-account'
import { createOffsiteBackupRepository } from './offsite.repository'

/**
 * Parsed once at boot so a malformed key fails loudly instead of at 03:00 on the first backup.
 * An absent variable leaves the feature off, and its routes answer 503.
 */
const account = env.FIREBASE_SERVICE_ACCOUNT_B64 ? decodeServiceAccount(env.FIREBASE_SERVICE_ACCOUNT_B64) : null

export const offsiteConfigured = Boolean(account && env.FIREBASE_DB_URL)

export const offsiteRepository = createOffsiteBackupRepository({
  dbUrl: env.FIREBASE_DB_URL ?? '',
  token: account
    ? createAccessToken(account)
    : async () => {
        throw new Error('Offsite backup is not configured')
      },
})
