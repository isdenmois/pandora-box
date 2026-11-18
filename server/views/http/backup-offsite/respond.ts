import { StatusMap, status } from 'elysia'
import type { OffsiteResult } from '@/app'

/** One mapping for both POSTs: the cron and the admin button read the same status codes. */
export function respond(result: OffsiteResult) {
  if (result.ok) {
    return status(StatusMap.Created, { key: result.key, bytes: result.bytes, pruned: result.pruned })
  }

  return result.reason === 'not-configured'
    ? status(StatusMap['Service Unavailable'], { message: result.message })
    : status(StatusMap['Bad Gateway'], { message: result.message })
}
