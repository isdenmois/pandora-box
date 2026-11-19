import type { OffsiteResult } from '@server/app'
import type { Context } from 'hono'
import { unavailable, upstream } from '../error'

/** One mapping for both POSTs: the cron and the admin button read the same status codes. */
export function respond(c: Context, result: OffsiteResult) {
  if (result.ok) {
    return c.json({ key: result.key, bytes: result.bytes, pruned: result.pruned }, 201)
  }

  return result.reason === 'not-configured' ? unavailable(c, result.message) : upstream(c, result.message)
}
