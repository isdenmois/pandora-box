import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AppEnv } from '../session'

vi.mock('../session', () => ({ getSession: vi.fn() }))

const { getSession } = await import('../session')
const { requireAuth } = await import('../auth.guard')
const { requireAdmin } = await import('../admin.guard')

const user = { id: 'user-1', username: 'john', role: 'user' }
const admin = { id: 'admin-1', username: 'root', role: 'admin' }

const appWith = (guard: typeof requireAuth) => new Hono<AppEnv>().use(guard).get('/', (c) => c.json(c.get('user'), 200))
const call = (app: ReturnType<typeof appWith>) => app.request('http://localhost/')

describe('requireAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('answers 401 when there is no session', async () => {
    // arrange
    vi.mocked(getSession).mockResolvedValue({ session: null, user: null })

    // act
    const response = await call(appWith(requireAuth))

    // assert
    expect(response.status).toBe(401)
    expect(await response.json()).toMatchObject({ error: { code: 'unauthorized' } })
  })

  it('injects the session user into the handler', async () => {
    // arrange
    vi.mocked(getSession).mockResolvedValue({ user } as never)

    // act
    const response = await call(appWith(requireAuth))

    // assert
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual(user)
  })
})

describe('requireAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('answers 401 for a signed-in user who is not an admin', async () => {
    // arrange
    vi.mocked(getSession).mockResolvedValue({ user } as never)

    // act
    const response = await call(appWith(requireAdmin))

    // assert
    expect(response.status).toBe(401)
  })

  it('answers 401 when there is no session', async () => {
    // arrange
    vi.mocked(getSession).mockResolvedValue({ session: null, user: null })

    // act
    const response = await call(appWith(requireAdmin))

    // assert
    expect(response.status).toBe(401)
  })

  it('lets an admin through', async () => {
    // arrange
    vi.mocked(getSession).mockResolvedValue({ user: admin } as never)

    // act
    const response = await call(appWith(requireAdmin))

    // assert
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual(admin)
  })
})
