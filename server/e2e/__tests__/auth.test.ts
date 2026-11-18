import { beforeEach, describe, expect, it } from 'vitest'
import { cookieFrom, request, resetDatabase, seedExpiringSession, seedSession, seedUser } from '../support/api'

describe('server e2e: auth', () => {
  beforeEach(resetDatabase)

  it('rejects a request with no session', async () => {
    // act
    const response = await request({ path: '/v1/user/current' })

    // assert
    expect(response.status).toBe(401)
  })

  it('answers an unknown username the same way as a wrong password', async () => {
    // arrange
    await seedUser('alice')

    // act
    const unknown = await request({
      method: 'POST',
      path: '/auth/login',
      body: { username: 'ghost', password: 'whatever' },
    })
    const wrongPassword = await request({
      method: 'POST',
      path: '/auth/login',
      body: { username: 'alice', password: 'wrong' },
    })

    // assert
    expect(unknown.status).toBe(400)
    expect(wrongPassword.status).toBe(400)
    expect(unknown.body).toEqual(wrongPassword.body)
    expect(unknown.setCookie).toBeNull()
    expect(wrongPassword.setCookie).toBeNull()
  })

  it('signs in and accepts the session cookie on the next request', async () => {
    // arrange
    const alice = await seedUser('alice')

    // act
    const login = await request<{ id: string; username: string; role: string }>({
      method: 'POST',
      path: '/auth/login',
      body: { username: alice.username, password: alice.password },
    })
    const current = await request<{ id: string }>({
      path: '/v1/user/current',
      cookie: cookieFrom(login.setCookie),
    })

    // assert
    expect(login.status).toBe(200)
    expect(login.body).toEqual({ id: alice.id, username: 'alice', role: 'user' })
    expect(login.setCookie).toContain('HttpOnly')
    expect(login.setCookie).toContain('Path=/')
    expect(current.status).toBe(200)
    expect(current.body.id).toBe(alice.id)
  })

  it('returns the active user instead of starting a second session', async () => {
    // arrange
    const alice = await seedSession('alice')

    // act
    const login = await request<{ id: string }>({
      method: 'POST',
      path: '/auth/login',
      body: { username: alice.username, password: alice.password },
      cookie: alice.cookie,
    })

    // assert
    expect(login.status).toBe(200)
    expect(login.body.id).toBe(alice.id)
    expect(login.setCookie).toBeNull()
  })

  it('retires the session on logout', async () => {
    // arrange
    const alice = await seedSession('alice')

    // act
    const logout = await request({ method: 'POST', path: '/auth/logout', cookie: alice.cookie })
    const after = await request({ path: '/v1/user/current', cookie: alice.cookie })

    // assert
    expect(logout.status).toBe(200)
    expect(after.status).toBe(401)
  })

  it('rotates a session that is close to expiry', async () => {
    // arrange
    const alice = await seedUser('alice')
    const { cookie: oldCookie } = await seedExpiringSession(alice.id, new Date(Date.now() + 24 * 60 * 60 * 1000))

    // act
    const current = await request<{ id: string }>({ path: '/v1/user/current', cookie: oldCookie })

    // assert
    expect(current.status).toBe(200)
    expect(current.body.id).toBe(alice.id)
    expect(current.setCookie).not.toBeNull()
    expect(cookieFrom(current.setCookie)).not.toBe(oldCookie)

    const retired = await request({ path: '/v1/user/current', cookie: oldCookie })
    expect(retired.status).toBe(401)
  })

  it('keeps admin routes away from regular users', async () => {
    // arrange
    const alice = await seedSession('alice')
    const admin = await seedSession('root', { role: 'admin' })

    // act
    const asUser = await request({ path: '/v1/admin/backup', cookie: alice.cookie })
    const asAdmin = await request({ path: '/v1/admin/backup', cookie: admin.cookie })

    // assert
    expect(asUser.status).toBe(401)
    expect(asAdmin.status).toBe(200)
  })
})
