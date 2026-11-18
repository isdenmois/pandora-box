import { randomUUID } from 'node:crypto'
import { table } from '@/domain'
import { db } from '@/infra'
import { hashPassword } from '@/shared'
import { app } from '../../index'

/**
 * HTTP-level harness. It sends real requests through `app.handle`, so routing, guards, cookies,
 * contracts, use-cases and SQLite all run exactly as they do when Bun serves the app; only the
 * socket is skipped. Each test file gets its own `:memory:` database from the vitest server config.
 */

export type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE'

export interface RequestOptions {
  method?: Method
  /** Path below `/api`, e.g. `/v1/movie`. */
  path: string
  body?: unknown
  /** Value of the `Cookie` header, as returned by `login`. */
  cookie?: string
}

export interface ApiResponse<T = unknown> {
  status: number
  body: T
  /** The session cookie the response asks the client to store, if any. */
  setCookie: string | null
}

export const PASSWORD = 'correct horse battery staple'

export async function request<T = unknown>({
  method = 'GET',
  path,
  body,
  cookie,
}: RequestOptions): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {}

  if (body !== undefined) {
    headers['content-type'] = 'application/json'
  }

  if (cookie) {
    headers.cookie = cookie
  }

  const response = await app.handle(
    new Request(`http://localhost/api${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  )
  const text = await response.text()
  const setCookie = response.headers.getSetCookie().find((value) => value.startsWith('auth-session=')) ?? null

  return { status: response.status, body: parseBody(text) as T, setCookie }
}

/** Guards answer with an empty body or plain text, so JSON is a best-effort parse. */
function parseBody(text: string) {
  if (!text) {
    return null
  }

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

/** Turns the `Set-Cookie` header into the `Cookie` header a browser would send next. */
export function cookieFrom(setCookie: string | null): string {
  if (!setCookie) {
    throw new Error('Expected the response to set a session cookie')
  }

  return setCookie.split(';')[0]
}

export interface SeededUser {
  id: string
  username: string
  password: string
  role: string
}

export async function seedUser(
  username: string,
  { password = PASSWORD, role = 'user' }: { password?: string; role?: string } = {},
): Promise<SeededUser> {
  const id = randomUUID()

  await db.insert(table.user).values({ id, username, passwordHash: hashPassword(password), role })

  return { id, username, password, role }
}

export interface AuthenticatedUser extends SeededUser {
  cookie: string
}

/** Seeds the account and signs in through the real route, so the cookie is the one a user gets. */
export async function seedSession(
  username: string,
  options?: { password?: string; role?: string },
): Promise<AuthenticatedUser> {
  const user = await seedUser(username, options)
  const response = await request({
    method: 'POST',
    path: '/auth/login',
    body: { username: user.username, password: user.password },
  })

  return { ...user, cookie: cookieFrom(response.setCookie) }
}

/** A session whose `expiresAt` the caller controls; used to exercise rotation. */
export async function seedExpiringSession(userId: string, expiresAt: Date) {
  const id = randomUUID()

  await db.insert(table.session).values({ id, userId, expiresAt })

  return { id, cookie: `auth-session=${id}` }
}

/** Empties every table so one test cannot see another test's rows. */
export async function resetDatabase() {
  await db.delete(table.movieView)
  await db.delete(table.seriesView)
  await db.delete(table.session)
  await db.delete(table.movie)
  await db.delete(table.series)
  await db.delete(table.user)
}
