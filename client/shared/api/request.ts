import type { ClientResponse } from 'hono/client'
import { apiError, type HttpResponseLike } from './error'

/**
 * The endpoint type is a union of every status (success + the global 401/500/503), so the output
 * has to be picked by status. `ok` is a literal per member, but not a discriminator TS can narrow
 * a generic on.
 */
type SuccessOf<R> = R extends ClientResponse<infer T, infer S, infer _F> ? (S extends 200 | 201 ? T : never) : never

/** For routes that answer a JSON body. */
export async function unwrap<R extends ClientResponse<unknown>>(response: R): Promise<SuccessOf<R>> {
  if (!response.ok) {
    throw await apiError(response)
  }

  return (await response.json()) as SuccessOf<R>
}

/** For routes that answer no body (the deletes and the restore). */
export async function ensure(response: HttpResponseLike): Promise<void> {
  if (!response.ok) {
    throw await apiError(response)
  }
}

/** For the backup download, which is a JSON file rather than a JSON value. */
export async function unwrapBlob(response: HttpResponseLike): Promise<Blob> {
  if (!response.ok) {
    throw await apiError(response)
  }

  return await response.blob()
}
