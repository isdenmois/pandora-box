import { timingSafeEqual } from 'node:crypto'
import { env } from '@server/infra/env'
import { createMiddleware } from 'hono/factory'
import { unauthorized, unavailable } from '../http/error'

/**
 * Constant-time comparison. Length differences leak the expected length, which is fine: the
 * secret's length is not what protects it.
 */
export function tokenMatches(provided: string | undefined, expected: string | undefined): boolean {
  if (!provided || !expected) {
    return false
  }

  const left = Buffer.from(provided)
  const right = Buffer.from(expected)

  return left.length === right.length && timingSafeEqual(left, right)
}

export function bearerToken(authorization: string | undefined): string | undefined {
  const [scheme, value] = authorization?.split(' ') ?? []

  return scheme?.toLowerCase() === 'bearer' && value ? value : undefined
}

/**
 * Machine auth for the offsite backup cron. No session involved: a bearer token can only reach
 * the routes that use this guard, never the rest of `/admin`.
 */
export function createBackupTokenGuard(expected: string | undefined) {
  return createMiddleware(async (c, next) => {
    // No token configured means the feature is off, which is a server-side condition, not a 401.
    if (!expected) {
      return unavailable(c, 'Offsite backup is not configured')
    }

    if (!tokenMatches(bearerToken(c.req.header('authorization')), expected)) {
      return unauthorized(c)
    }

    await next()
  })
}

export const backupTokenGuard = createBackupTokenGuard(env.BACKUP_TOKEN)
