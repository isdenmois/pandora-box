import type { Context } from 'hono'

/**
 * The wire error body. The statuses are frozen by the e2e suite; the shape is ours, and `hc`
 * narrows it per status because every helper below returns a literal status.
 */
export type ErrorCode =
  | 'validation'
  | 'unauthorized'
  | 'invalid_credentials'
  | 'not_found'
  | 'conflict'
  | 'unavailable'
  | 'upstream'
  | 'internal'

export interface ErrorDetails {
  /** Dotted path into the request body, e.g. `title` or `tags.0`. */
  path: string
  message: string
}

export interface ErrorBody {
  error: {
    code: ErrorCode
    message: string
    details?: ErrorDetails[]
  }
}

export function errorBody(code: ErrorCode, message: string, details?: ErrorDetails[]): ErrorBody {
  return { error: details ? { code, message, details } : { code, message } }
}

export const validationFailed = (c: Context, details: ErrorDetails[]) =>
  c.json(errorBody('validation', 'Invalid request', details), 422)

export const invalid = (c: Context, message = 'Invalid request') => c.json(errorBody('validation', message), 422)

export const unauthorized = (c: Context, message = 'Unauthorized') => c.json(errorBody('unauthorized', message), 401)

export const notFound = (c: Context, message = 'Not found') => c.json(errorBody('not_found', message), 404)

export const conflict = (c: Context, message = 'Conflict') => c.json(errorBody('conflict', message), 409)

export const unavailable = (c: Context, message = 'Service unavailable') =>
  c.json(errorBody('unavailable', message), 503)

export const upstream = (c: Context, message = 'Upstream failure') => c.json(errorBody('upstream', message), 502)

export const internal = (c: Context, message = 'Internal server error') => c.json(errorBody('internal', message), 500)

export const badRequest = (c: Context, message: string, code: ErrorCode = 'invalid_credentials') =>
  c.json(errorBody(code, message), 400)
