import type { Context } from 'hono'
import { validator } from 'hono/validator'
import * as v from 'valibot'
import { type ErrorDetails, validationFailed } from './error'

/** Dotted paths keep the details a stable wire contract for forms and tests. */
export function issuesToDetails(issues: readonly v.BaseIssue<unknown>[]): ErrorDetails[] {
  return issues.map((issue) => ({
    path: (issue.path ?? []).map((item) => String(item.key)).join('.'),
    message: issue.message,
  }))
}

function parse<S extends v.GenericSchema>(
  schema: S,
  value: unknown,
  c: Context,
): v.InferOutput<S> | ReturnType<typeof validationFailed> {
  const result = v.safeParse(schema, value)

  return result.success ? result.output : validationFailed(c, issuesToDetails(result.issues))
}

/**
 * Core `validator()` takes a function rather than a schema, so these wrappers are the only place
 * that knows the failure status (422, not the usual 400) and the envelope. The output type of the
 * valibot schema flows into `c.req.valid(...)`.
 */
export const vjson = <S extends v.GenericSchema>(schema: S) => validator('json', (value, c) => parse(schema, value, c))

export const vquery = <S extends v.GenericSchema>(schema: S) =>
  validator('query', (value, c) => parse(schema, value, c))

export const vparam = <S extends v.GenericSchema>(schema: S) =>
  validator('param', (value, c) => parse(schema, value, c))

export const vform = <S extends v.GenericSchema>(schema: S) => validator('form', (value, c) => parse(schema, value, c))
