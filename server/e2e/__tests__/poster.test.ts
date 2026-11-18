import { readdir } from 'node:fs/promises'
import { beforeEach, describe, expect, it } from 'vitest'
import { env } from '@/infra'
import { request, requestBytes, resetDatabase, seedSession } from '../support/api'
import { PNG, uploadPosterForm } from '../support/poster'
import { moviePayload } from '../support/records'

/**
 * A loopback source: the fetcher refuses private addresses before any network call, so a cold
 * miss deterministically takes the redirect fallback without DNS or sockets in the test run.
 */
const SOURCE = 'http://127.0.0.1/poster.jpg'

/** The files currently in the image dir; absent dir means no poster was ever written. */
const storedFiles = () => readdir(env.IMAGE_DIR).catch(() => [] as string[])

describe('server e2e: posters', () => {
  beforeEach(resetDatabase)

  it('stores an uploaded poster and serves it from the image route', async () => {
    // arrange
    const alice = await seedSession('alice')
    const movie = await request<{ id: string }>({
      method: 'POST',
      path: '/v1/movie',
      cookie: alice.cookie,
      body: moviePayload({ title: 'Before' }),
    })
    const id = movie.body.id

    // act
    const uploaded = await request<{ title: string; poster: string; posterSource: string | null }>({
      method: 'PATCH',
      path: `/v1/movie/${id}/poster`,
      cookie: alice.cookie,
      form: uploadPosterForm({ title: 'After' }),
    })
    const served = await requestBytes({ path: `/images/${id}.png`, base: 'root' })

    // assert
    expect(uploaded.status).toBe(200)
    expect(uploaded.body.title).toBe('After')
    expect(uploaded.body.poster).toBe(`/images/${id}.png`)
    expect(uploaded.body.posterSource).toBeNull()
    expect(served.status).toBe(200)
    expect(served.contentType).toBe('image/png')
    expect(Buffer.from(served.bytes).equals(PNG)).toBe(true)
  })

  it('answers 409 when a manual poster is asked to re-download', async () => {
    // arrange
    const alice = await seedSession('alice')
    const movie = await request<{ id: string }>({
      method: 'POST',
      path: '/v1/movie',
      cookie: alice.cookie,
      body: moviePayload(),
    })
    await request({
      method: 'PATCH',
      path: `/v1/movie/${movie.body.id}/poster`,
      cookie: alice.cookie,
      form: uploadPosterForm({}),
    })

    // act
    const dropped = await request({ method: 'DELETE', path: `/v1/poster/${movie.body.id}`, cookie: alice.cookie })

    // assert
    expect(dropped.status).toBe(409)
  })

  it('keeps a private row’s poster away from other users', async () => {
    // arrange
    const alice = await seedSession('alice')
    const bob = await seedSession('bob')
    const movie = await request<{ id: string }>({
      method: 'POST',
      path: '/v1/movie',
      cookie: alice.cookie,
      body: moviePayload({ private: true }),
    })

    // act
    const uploaded = await request({
      method: 'PATCH',
      path: `/v1/movie/${movie.body.id}/poster`,
      cookie: bob.cookie,
      form: uploadPosterForm({}),
    })

    // assert
    expect(uploaded.status).toBe(404)
  })

  it('stores a remote source URL as a local path without downloading eagerly', async () => {
    // arrange
    const alice = await seedSession('alice')

    // act
    const created = await request<{ id: string; poster: string; posterSource: string }>({
      method: 'POST',
      path: '/v1/movie',
      cookie: alice.cookie,
      body: moviePayload({ poster: SOURCE }),
    })

    // assert
    expect(created.status).toBe(200)
    expect(created.body.poster).toBe(`/images/${created.body.id}.jpg`)
    expect(created.body.posterSource).toBe(SOURCE)
    // The file is fetched lazily on the first view; nothing lands on disk at create time.
    expect(await storedFiles()).not.toContain(`${created.body.id}.jpg`)
  })

  it('redirects a cold miss to the source, with or without a session', async () => {
    // arrange
    const alice = await seedSession('alice')
    const created = await request<{ id: string }>({
      method: 'POST',
      path: '/v1/movie',
      cookie: alice.cookie,
      body: moviePayload({ poster: SOURCE }),
    })

    // act
    const withSession = await requestBytes({
      path: `/images/${created.body.id}.jpg`,
      base: 'root',
      cookie: alice.cookie,
    })
    const withoutSession = await requestBytes({ path: `/images/${created.body.id}.jpg`, base: 'root' })

    // assert
    // With a session the downloader runs and refuses the private address; without one it never
    // runs. Both must hand the bytes back to the CDN instead of failing the card render.
    expect(withSession.status).toBe(302)
    expect(withoutSession.status).toBe(302)
    expect(withSession.location).toBe(SOURCE)
    expect(withoutSession.location).toBe(SOURCE)
    expect(withSession.cacheControl).toBe('no-store')
  })

  it('redirects to the stored path when the extension does not match the row', async () => {
    // arrange
    const alice = await seedSession('alice')
    const created = await request<{ id: string }>({
      method: 'POST',
      path: '/v1/movie',
      cookie: alice.cookie,
      body: moviePayload({ poster: SOURCE }),
    })

    // act
    const redirected = await requestBytes({ path: `/images/${created.body.id}.png`, base: 'root' })

    // assert
    // The row says jpg; a request for png is a stale guess, and the client is corrected.
    expect(redirected.status).toBe(302)
    expect(redirected.location).toBe(`/images/${created.body.id}.jpg`)
  })

  it('drops the file for re-download and keeps the row pointing at the source', async () => {
    // arrange
    const alice = await seedSession('alice')
    const created = await request<{ id: string }>({
      method: 'POST',
      path: '/v1/movie',
      cookie: alice.cookie,
      body: moviePayload({ poster: SOURCE }),
    })

    // act
    const dropped = await request<{ poster: string; posterSource: string }>({
      method: 'DELETE',
      path: `/v1/poster/${created.body.id}`,
      cookie: alice.cookie,
    })

    // assert
    // Unlike a manual poster, this row has a source, so the delete is a re-download reset:
    // the row keeps both columns and the next view downloads again.
    expect(dropped.status).toBe(200)
    expect(dropped.body.poster).toBe(`/images/${created.body.id}.jpg`)
    expect(dropped.body.posterSource).toBe(SOURCE)
  })

  it('answers 304 when the stored file has not changed', async () => {
    // arrange
    const alice = await seedSession('alice')
    const movie = await request<{ id: string }>({
      method: 'POST',
      path: '/v1/movie',
      cookie: alice.cookie,
      body: moviePayload(),
    })
    const id = movie.body.id
    await request({
      method: 'PATCH',
      path: `/v1/movie/${id}/poster`,
      cookie: alice.cookie,
      form: uploadPosterForm({}),
    })
    const served = await requestBytes({ path: `/images/${id}.png`, base: 'root' })
    expect(served.status).toBe(200)
    expect(served.etag).toBeTruthy()

    // act
    const revalidated = await requestBytes({
      path: `/images/${id}.png`,
      base: 'root',
      headers: { 'if-none-match': served.etag! },
    })

    // assert
    // The etag is derived from the bytes, so an unchanged poster never travels the wire again.
    expect(revalidated.status).toBe(304)
  })
})
