import { beforeEach, describe, expect, it } from 'vitest'
import { request, resetDatabase, seedSession } from '../support/api'

describe('server e2e: user directory', () => {
  beforeEach(resetDatabase)

  it('requires a session', async () => {
    // act
    const response = await request({ path: '/v1/user' })

    // assert
    expect(response.status).toBe(401)
  })

  it('lists ids and usernames only, never roles or password hashes', async () => {
    // arrange
    await seedSession('alice')
    const bob = await seedSession('bob', { role: 'admin' })

    // act
    const response = await request<Record<string, unknown>[]>({ path: '/v1/user', cookie: bob.cookie })

    // assert
    expect(response.status).toBe(200)
    expect(response.body).toEqual([
      { id: expect.any(String), username: 'alice' },
      { id: bob.id, username: 'bob' },
    ])
    for (const user of response.body) {
      expect(Object.keys(user).sort()).toEqual(['id', 'username'])
    }
  })
})
