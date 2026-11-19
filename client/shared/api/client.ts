import type { Hono } from 'hono'
import { hc } from 'hono/client'
import { useAuth } from '../lib/auth/auth-state'

/**
 * The single response interceptor `hc` offers. It runs after the response arrives, so a 401/403
 * clears the auth state without consuming the body the caller still needs to read.
 */
export const apiFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const response = await fetch(input, init)

  if (response.status === 401 || response.status === 403) {
    useAuth().setUser(null)
  }

  return response
}

/** Each API module instantiates this with its own sub-app type; see `app-type.ts`. */
// biome-ignore lint/suspicious/noExplicitAny: `hc` itself constrains its app type to `Hono<any, any, any>`.
export function createClient<T extends Hono<any, any, any>>(baseUrl: string) {
  return hc<T>(baseUrl, { fetch: apiFetch })
}
