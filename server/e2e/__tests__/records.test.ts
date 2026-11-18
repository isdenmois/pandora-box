import { beforeEach, describe, expect, it } from 'vitest'
import { request, resetDatabase, seedSession } from '../support/api'
import { resources } from '../support/records'

describe.each(resources)('server e2e: $name access rules', ({ path, create }) => {
  beforeEach(resetDatabase)

  it('requires a session to create a record', async () => {
    // act
    const response = await request({ method: 'POST', path, body: create() })

    // assert
    expect(response.status).toBe(401)
  })

  it('sets the creator from the session, not the body', async () => {
    // arrange
    const alice = await seedSession('alice')

    // act
    const response = await request<{ id: string; createdBy: string }>({
      method: 'POST',
      path,
      cookie: alice.cookie,
      body: create({ createdBy: 'someone-else' }),
    })

    // assert
    expect(response.status).toBe(200)
    expect(response.body.createdBy).toBe(alice.id)
  })

  it('hides a private row from everyone but its creator', async () => {
    // arrange
    const alice = await seedSession('alice')
    const bob = await seedSession('bob')
    const created = await request<{ id: string }>({
      method: 'POST',
      path,
      cookie: alice.cookie,
      body: create({ title: 'Secret', private: true }),
    })
    const id = created.body.id

    // act
    const listForBob = await request<{ id: string }[]>({ path, cookie: bob.cookie })
    const readForBob = await request({ path: `${path}/${id}`, cookie: bob.cookie })
    const readForAlice = await request<{ title: string }>({ path: `${path}/${id}`, cookie: alice.cookie })

    // assert
    expect(listForBob.body.map((row) => row.id)).not.toContain(id)
    expect(readForBob.status).toBe(404)
    expect(readForAlice.status).toBe(200)
    expect(readForAlice.body.title).toBe('Secret')
  })

  it('answers 404 to a foreign edit and leaves the row untouched', async () => {
    // arrange
    const alice = await seedSession('alice')
    const bob = await seedSession('bob')
    const created = await request<{ id: string }>({
      method: 'POST',
      path,
      cookie: alice.cookie,
      body: create({ title: 'Original', private: true }),
    })

    // act
    const patchForBob = await request({
      method: 'PATCH',
      path: `${path}/${created.body.id}`,
      cookie: bob.cookie,
      body: { title: 'Hijacked' },
    })
    const readForAlice = await request<{ title: string }>({
      path: `${path}/${created.body.id}`,
      cookie: alice.cookie,
    })

    // assert
    expect(patchForBob.status).toBe(404)
    expect(readForAlice.body.title).toBe('Original')
  })

  it('answers 404 to a foreign delete and keeps the row', async () => {
    // arrange
    const alice = await seedSession('alice')
    const bob = await seedSession('bob')
    const created = await request<{ id: string }>({
      method: 'POST',
      path,
      cookie: alice.cookie,
      body: create({ private: true }),
    })

    // act
    const deleteForBob = await request({
      method: 'DELETE',
      path: `${path}/${created.body.id}`,
      cookie: bob.cookie,
    })
    const readForAlice = await request({ path: `${path}/${created.body.id}`, cookie: alice.cookie })

    // assert
    expect(deleteForBob.status).toBe(404)
    expect(readForAlice.status).toBe(200)
  })

  it('shares a global row and lets another user edit it', async () => {
    // arrange
    const alice = await seedSession('alice')
    const bob = await seedSession('bob')
    const created = await request<{ id: string }>({
      method: 'POST',
      path,
      cookie: alice.cookie,
      body: create({ title: 'Shared', private: false }),
    })

    // act
    const listForBob = await request<{ id: string }[]>({ path, cookie: bob.cookie })
    const patchForBob = await request<{ title: string }>({
      method: 'PATCH',
      path: `${path}/${created.body.id}`,
      cookie: bob.cookie,
      body: { title: 'Edited by Bob' },
    })

    // assert
    expect(listForBob.body.map((row) => row.id)).toContain(created.body.id)
    expect(patchForBob.status).toBe(200)
    expect(patchForBob.body.title).toBe('Edited by Bob')
  })

  it('claims a global row when another user makes it private', async () => {
    // arrange
    const alice = await seedSession('alice')
    const bob = await seedSession('bob')
    const created = await request<{ id: string }>({
      method: 'POST',
      path,
      cookie: alice.cookie,
      body: create({ private: false }),
    })

    // act
    const claimed = await request<{ createdBy: string; private: boolean }>({
      method: 'PATCH',
      path: `${path}/${created.body.id}`,
      cookie: bob.cookie,
      body: { private: true },
    })
    const readForAlice = await request({ path: `${path}/${created.body.id}`, cookie: alice.cookie })

    // assert
    expect(claimed.body.createdBy).toBe(bob.id)
    expect(claimed.body.private).toBe(true)
    expect(readForAlice.status).toBe(404)
  })

  it('records a view for the viewer only', async () => {
    // arrange
    const alice = await seedSession('alice')
    const bob = await seedSession('bob')
    const created = await request<{ id: string }>({
      method: 'POST',
      path,
      cookie: alice.cookie,
      body: create({ title: 'Watched' }),
    })
    const id = created.body.id

    // act
    const viewed = await request({
      method: 'POST',
      path: `${path}/${id}/viewed`,
      cookie: bob.cookie,
      body: { date: '2026-11-18', rating: 8, comment: 'Good one' },
    })
    const aliceViews = await request<unknown[]>({ path: `${path}/views`, cookie: alice.cookie })
    const bobViews = await request<{ id: string }[]>({ path: `${path}/views`, cookie: bob.cookie })
    const readAsBob = await request<{ seen: string; seenRating: number; seenComment: string }>({
      path: `${path}/${id}`,
      cookie: bob.cookie,
    })

    // assert
    expect(viewed.status).toBe(200)
    expect(aliceViews.body).toEqual([])
    expect(bobViews.body.map((view) => view.id)).toHaveLength(1)
    expect(readAsBob.body).toMatchObject({ seen: '2026-11-18', seenRating: 8, seenComment: 'Good one' })
  })

  it('keeps a private row out of another user’s view history', async () => {
    // arrange
    const alice = await seedSession('alice')
    const bob = await seedSession('bob')
    const created = await request<{ id: string }>({
      method: 'POST',
      path,
      cookie: alice.cookie,
      body: create({ private: true }),
    })

    // act
    const viewed = await request({
      method: 'POST',
      path: `${path}/${created.body.id}/viewed`,
      cookie: bob.cookie,
      body: { date: '2026-11-18', rating: 5, comment: '' },
    })
    const bobViews = await request<unknown[]>({ path: `${path}/views`, cookie: bob.cookie })

    // assert
    expect(viewed.status).toBe(404)
    expect(bobViews.body).toEqual([])
  })

  it('lists own private rows together with other users’ shared ones', async () => {
    // arrange
    const alice = await seedSession('alice')
    const bob = await seedSession('bob')
    const ownPrivate = await request<{ id: string }>({
      method: 'POST',
      path,
      cookie: alice.cookie,
      body: create({ title: 'Own secret', private: true }),
    })
    const foreignShared = await request<{ id: string }>({
      method: 'POST',
      path,
      cookie: bob.cookie,
      body: create({ title: 'Bobs shared' }),
    })

    // act
    const list = await request<{ id: string }[]>({ path, cookie: alice.cookie })

    // assert
    // The list is `own rows or shared`: both of alice's must appear, none of bob's private ones.
    expect(list.body).toHaveLength(2)
    expect(list.body.map((row) => row.id)).toEqual(expect.arrayContaining([ownPrivate.body.id, foreignShared.body.id]))
  })

  it('clears the view history when the view is removed', async () => {
    // arrange
    const alice = await seedSession('alice')
    const bob = await seedSession('bob')
    const created = await request<{ id: string }>({
      method: 'POST',
      path,
      cookie: alice.cookie,
      body: create(),
    })
    const id = created.body.id
    await request({
      method: 'POST',
      path: `${path}/${id}/viewed`,
      cookie: bob.cookie,
      body: { date: '2026-11-18', rating: 8, comment: 'Good one' },
    })

    // act
    const removed = await request({ method: 'DELETE', path: `${path}/${id}/view`, cookie: alice.cookie })
    const bobViews = await request<unknown[]>({ path: `${path}/views`, cookie: bob.cookie })
    const readAsBob = await request<{ seen: string | null }>({ path: `${path}/${id}`, cookie: bob.cookie })

    // assert
    expect(removed.status).toBe(200)
    expect(bobViews.body).toEqual([])
    expect(readAsBob.body.seen).toBeNull()
  })

  it('rejects recommending yourself', async () => {
    // arrange
    const alice = await seedSession('alice')

    // act
    const response = await request({
      method: 'POST',
      path,
      cookie: alice.cookie,
      body: create({ recommendedBy: alice.id }),
    })

    // assert
    expect(response.status).toBe(422)
  })

  it('rejects recommending someone who does not exist', async () => {
    // arrange
    const alice = await seedSession('alice')

    // act
    const response = await request({
      method: 'POST',
      path,
      cookie: alice.cookie,
      body: create({ recommendedBy: 'ghost' }),
    })

    // assert
    expect(response.status).toBe(422)
  })
})
