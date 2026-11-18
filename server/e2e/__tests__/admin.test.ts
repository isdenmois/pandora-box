import { beforeEach, describe, expect, it } from 'vitest'
import { request, resetDatabase, seedSession } from '../support/api'
import { moviePayload, seriesPayload } from '../support/records'

interface Backup {
  movie: Record<string, unknown>[]
  series: Record<string, unknown>[]
  user: Record<string, unknown>[]
  movieView: Record<string, unknown>[]
  seriesView: Record<string, unknown>[]
  session?: Record<string, unknown>[]
}

describe('server e2e: admin', () => {
  beforeEach(resetDatabase)

  it('keeps every admin route behind the admin role', async () => {
    // arrange
    const alice = await seedSession('alice')

    // act
    const routes = [
      { method: 'POST' as const, path: '/v1/admin/register', body: { username: 'mallory', password: '1234' } },
      { method: 'GET' as const, path: '/v1/admin/backup' },
      { method: 'POST' as const, path: '/v1/admin/backup', body: {} },
      { method: 'GET' as const, path: '/v1/admin/attribution' },
      { method: 'DELETE' as const, path: '/v1/admin/images/orphans' },
    ]
    const responses = await Promise.all(routes.map((route) => request({ ...route, cookie: alice.cookie })))

    // assert
    expect(responses.map((response) => response.status)).toEqual([401, 401, 401, 401, 401])
  })

  it('registers an account that can sign in', async () => {
    // arrange
    const admin = await seedSession('root', { role: 'admin' })

    // act
    const registered = await request({
      method: 'POST',
      path: '/v1/admin/register',
      cookie: admin.cookie,
      body: { username: 'newcomer', password: 'secret' },
    })
    const login = await request<{ id: string; username: string }>({
      method: 'POST',
      path: '/auth/login',
      body: { username: 'newcomer', password: 'secret' },
    })

    // assert
    expect(registered.status).toBe(201)
    expect(login.status).toBe(200)
    expect(login.body.username).toBe('newcomer')
  })

  it('refuses a duplicate username without breaking the existing account', async () => {
    // arrange
    const admin = await seedSession('root', { role: 'admin' })
    await seedSession('alice')

    // act
    const duplicate = await request({
      method: 'POST',
      path: '/v1/admin/register',
      cookie: admin.cookie,
      body: { username: 'alice', password: 'new-secret' },
    })
    const login = await request({
      method: 'POST',
      path: '/auth/login',
      body: { username: 'alice', password: 'new-secret' },
    })

    // assert
    expect(duplicate.status).toBe(500)
    expect(login.status).toBe(400)
  })

  it('backs up every record table but not sessions', async () => {
    // arrange
    const admin = await seedSession('root', { role: 'admin' })
    const alice = await seedSession('alice')
    const movie = await request<{ id: string }>({
      method: 'POST',
      path: '/v1/movie',
      cookie: alice.cookie,
      body: moviePayload({ private: true }),
    })
    await request({
      method: 'POST',
      path: '/v1/series',
      cookie: alice.cookie,
      body: seriesPayload(),
    })
    await request({
      method: 'POST',
      path: `/v1/movie/${movie.body.id}/viewed`,
      cookie: alice.cookie,
      body: { date: '2026-11-18', rating: 7, comment: '' },
    })

    // act
    const response = await request<Backup>({ path: '/v1/admin/backup', cookie: admin.cookie })

    // assert
    expect(response.status).toBe(200)
    expect(response.body.movie).toHaveLength(1)
    expect(response.body.series).toHaveLength(1)
    expect(response.body.movieView).toHaveLength(1)
    expect(response.body.user).toHaveLength(2)
    expect(response.body.user.every((row) => 'passwordHash' in row)).toBe(true)
    expect(response.body).not.toHaveProperty('session')
  })

  it('restores a snapshot exactly, bringing back deletes and dropping later rows', async () => {
    // arrange
    const admin = await seedSession('root', { role: 'admin' })
    const alice = await seedSession('alice')
    const kept = await request<{ id: string; title: string }>({
      method: 'POST',
      path: '/v1/movie',
      cookie: alice.cookie,
      body: moviePayload({ title: 'Keep me' }),
    })
    const snapshot = await request<Backup>({ path: '/v1/admin/backup', cookie: admin.cookie })
    await request({ method: 'DELETE', path: `/v1/movie/${kept.body.id}`, cookie: alice.cookie })
    await request({
      method: 'POST',
      path: '/v1/movie',
      cookie: alice.cookie,
      body: moviePayload({ title: 'Added after the backup' }),
    })

    // act
    const restored = await request({
      method: 'POST',
      path: '/v1/admin/backup',
      cookie: admin.cookie,
      body: snapshot.body,
    })
    const list = await request<{ title: string }[]>({ path: '/v1/movie', cookie: alice.cookie })

    // assert
    expect(restored.status).toBe(200)
    expect(list.body.map((row) => row.title)).toEqual(['Keep me'])
  })

  describe('attribution', () => {
    it('lists only shared rows', async () => {
      // arrange
      const admin = await seedSession('root', { role: 'admin' })
      const alice = await seedSession('alice')
      await request({
        method: 'POST',
        path: '/v1/movie',
        cookie: alice.cookie,
        body: moviePayload({ title: 'Shared', private: false }),
      })
      await request({
        method: 'POST',
        path: '/v1/movie',
        cookie: alice.cookie,
        body: moviePayload({ title: 'Private', private: true }),
      })

      // act
      const response = await request<{ movies: { title: string }[] }>({
        path: '/v1/admin/attribution',
        cookie: admin.cookie,
      })

      // assert
      expect(response.body.movies.map((row) => row.title)).toEqual(['Shared'])
    })

    it('moves a shared row to the chosen creator', async () => {
      // arrange
      const admin = await seedSession('root', { role: 'admin' })
      const alice = await seedSession('alice')
      const bob = await seedSession('bob')
      const movie = await request<{ id: string }>({
        method: 'POST',
        path: '/v1/movie',
        cookie: alice.cookie,
        body: moviePayload({ private: false }),
      })

      // act
      const response = await request<{ updated: number }>({
        method: 'PATCH',
        path: '/v1/admin/attribution',
        cookie: admin.cookie,
        body: { movies: [movie.body.id], createdBy: bob.id },
      })
      const read = await request<{ createdBy: string }>({
        path: `/v1/movie/${movie.body.id}`,
        cookie: bob.cookie,
      })

      // assert
      expect(response.status).toBe(200)
      expect(response.body.updated).toBe(1)
      expect(read.body.createdBy).toBe(bob.id)
    })

    it('clears a recommendation that would credit the new creator', async () => {
      // arrange
      const admin = await seedSession('root', { role: 'admin' })
      const alice = await seedSession('alice')
      const bob = await seedSession('bob')
      const movie = await request<{ id: string }>({
        method: 'POST',
        path: '/v1/movie',
        cookie: alice.cookie,
        body: moviePayload({ private: false, recommendedBy: bob.id }),
      })

      // act
      await request({
        method: 'PATCH',
        path: '/v1/admin/attribution',
        cookie: admin.cookie,
        body: { movies: [movie.body.id], createdBy: bob.id },
      })
      const read = await request<{ recommendedBy: string | null }>({
        path: `/v1/movie/${movie.body.id}`,
        cookie: bob.cookie,
      })

      // assert
      expect(read.body.recommendedBy).toBeNull()
    })

    it('refuses a batch that names a private row and changes nothing', async () => {
      // arrange
      const admin = await seedSession('root', { role: 'admin' })
      const alice = await seedSession('alice')
      const bob = await seedSession('bob')
      const shared = await request<{ id: string }>({
        method: 'POST',
        path: '/v1/movie',
        cookie: alice.cookie,
        body: moviePayload({ private: false }),
      })
      const hidden = await request<{ id: string }>({
        method: 'POST',
        path: '/v1/movie',
        cookie: alice.cookie,
        body: moviePayload({ private: true }),
      })

      // act
      const response = await request({
        method: 'PATCH',
        path: '/v1/admin/attribution',
        cookie: admin.cookie,
        body: { movies: [shared.body.id, hidden.body.id], createdBy: bob.id },
      })
      const read = await request<{ createdBy: string }>({
        path: `/v1/movie/${shared.body.id}`,
        cookie: bob.cookie,
      })

      // assert
      expect(response.status).toBe(409)
      expect(read.body.createdBy).toBe(alice.id)
    })

    it('rejects an empty selection and an unknown creator', async () => {
      // arrange
      const admin = await seedSession('root', { role: 'admin' })
      const alice = await seedSession('alice')
      const movie = await request<{ id: string }>({
        method: 'POST',
        path: '/v1/movie',
        cookie: alice.cookie,
        body: moviePayload({ private: false }),
      })

      // act
      const empty = await request({
        method: 'PATCH',
        path: '/v1/admin/attribution',
        cookie: admin.cookie,
        body: { createdBy: alice.id },
      })
      const ghost = await request({
        method: 'PATCH',
        path: '/v1/admin/attribution',
        cookie: admin.cookie,
        body: { movies: [movie.body.id], createdBy: 'ghost' },
      })

      // assert
      expect(empty.status).toBe(422)
      expect(ghost.status).toBe(422)
    })
  })
})
