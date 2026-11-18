import { beforeEach, describe, expect, it } from 'vitest'
import { request, requestBytes, resetDatabase, seedSession } from '../support/api'
import { moviePayload } from '../support/records'

/** A real 1×1 PNG: signature and IEND chunk included, so the server-side checks accept it. */
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

function uploadForm(fields: Record<string, unknown>, fileName = 'poster.jpg') {
  const form = new FormData()

  form.append('data', JSON.stringify(fields))
  // The name lies about the type on purpose: the extension must come from the bytes.
  form.append('file', new File([PNG], fileName, { type: 'image/jpeg' }))

  return form
}

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
      form: uploadForm({ title: 'After' }),
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
      form: uploadForm({}),
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
      form: uploadForm({}),
    })

    // assert
    expect(uploaded.status).toBe(404)
  })
})
