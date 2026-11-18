import { beforeEach, describe, expect, it } from 'vitest'
import { request, resetDatabase, seedSession } from '../support/api'

/**
 * The test env configures no Firebase credentials and no `BACKUP_TOKEN`, which is exactly the
 * "feature off" state: both halves of the offsite pair must answer 503 instead of pretending
 * to run, and the admin half stays behind the admin guard even while off.
 */
describe('server e2e: offsite backup gates', () => {
  beforeEach(resetDatabase)

  it('tells the admin the feature is not configured', async () => {
    // arrange
    const admin = await seedSession('root', { role: 'admin' })

    // act
    const listing = await request<{ keys: string[] }>({
      method: 'GET',
      path: '/v1/admin/backup/offsite',
      cookie: admin.cookie,
    })
    const upload = await request({ method: 'POST', path: '/v1/admin/backup/offsite', cookie: admin.cookie })

    // assert
    expect(listing.status).toBe(503)
    expect(upload.status).toBe(503)
    expect(listing.body).toEqual({ message: 'Offsite backup is not configured' })
  })

  it('keeps the admin routes behind the role even while the feature is off', async () => {
    // arrange
    const alice = await seedSession('alice')

    // act
    const listing = await request({ method: 'GET', path: '/v1/admin/backup/offsite', cookie: alice.cookie })
    const upload = await request({ method: 'POST', path: '/v1/admin/backup/offsite', cookie: alice.cookie })

    // assert
    // The guard answers before the feature check, so a regular user never learns the state.
    expect(listing.status).toBe(401)
    expect(upload.status).toBe(401)
  })

  it('answers 503 to the machine route regardless of the token it sends', async () => {
    // act
    const anonymous = await request({ method: 'POST', path: '/v1/backup/offsite' })
    const withToken = await request({
      method: 'POST',
      path: '/v1/backup/offsite',
      headers: { authorization: 'Bearer not-the-configured-token' },
    })

    // assert
    // No configured token means the route is off, which is a server condition, not a 401.
    expect(anonymous.status).toBe(503)
    expect(withToken.status).toBe(503)
  })
})
