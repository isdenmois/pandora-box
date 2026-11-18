import { Elysia } from 'elysia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../session', () => ({ getSession: vi.fn() }))

const { getSession } = await import('../session')
const { authGuard } = await import('../auth.guard')
const { adminGuard } = await import('../admin.guard')

const user = { id: 'user-1', username: 'john', role: 'user' }
const admin = { id: 'admin-1', username: 'root', role: 'admin' }

const appWith = (guard: typeof authGuard) => new Elysia().use(guard).get('/', ({ user }) => user)
const call = (app: ReturnType<typeof appWith>) => app.handle(new Request('http://localhost/'))

describe('authGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('answers 401 when there is no session', async () => {
    // arrange
    vi.mocked(getSession).mockResolvedValue({ session: null, user: null })

    // act
    const response = await call(appWith(authGuard))

    // assert
    expect(response.status).toBe(401)
  })

  it('injects the session user into the handler', async () => {
    // arrange
    vi.mocked(getSession).mockResolvedValue({ user } as never)

    // act
    const response = await call(appWith(authGuard))

    // assert
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual(user)
  })
})

describe('adminGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('answers 401 for a signed-in user who is not an admin', async () => {
    // arrange
    vi.mocked(getSession).mockResolvedValue({ user } as never)

    // act
    const response = await call(appWith(adminGuard))

    // assert
    expect(response.status).toBe(401)
  })

  it('answers 401 when there is no session', async () => {
    // arrange
    vi.mocked(getSession).mockResolvedValue({ session: null, user: null })

    // act
    const response = await call(appWith(adminGuard))

    // assert
    expect(response.status).toBe(401)
  })

  it('lets an admin through', async () => {
    // arrange
    vi.mocked(getSession).mockResolvedValue({ user: admin } as never)

    // act
    const response = await call(appWith(adminGuard))

    // assert
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual(admin)
  })
})
