import { describe, expect, it, vi } from 'vitest'

// The controller module also builds the production instance, which reaches the database
// through `@/infra`; stubbing both keeps these tests free of bun:sqlite.
vi.mock('@/infra', () => ({
  movieRepository: { byId: vi.fn(), setPosterPath: vi.fn() },
  seriesRepository: { byId: vi.fn(), setPosterPath: vi.fn() },
  posterRepository: {
    read: vi.fn(),
    download: vi.fn(),
    save: vi.fn(),
    fetcher: { isFailing: vi.fn() },
  },
}))

vi.mock('@/views/auth', () => ({
  getSession: vi.fn(async () => ({ user: null })),
}))

const { createImageController } = await import('../image.controller')

type ImageControllerDeps = Parameters<typeof createImageController>[0]
interface PosterRecord {
  poster: string | null
  posterSource: string | null
}

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xd9])
const SOURCE = 'https://cdn.example.com/poster.jpg'
const ID = 'movie-1'

type Handler = (request: Request) => Promise<Response>

/** Builds the handler with everything but the pieces under test stubbed out. */
function setup(overrides: Partial<ImageControllerDeps> = {}) {
  const deps: ImageControllerDeps = {
    read: vi.fn(async (): Promise<{ bytes: Uint8Array; contentType: string; etag: string } | null> => null),
    download: vi.fn(async () => ({ bytes: JPEG, extension: 'jpg' as const })),
    save: vi.fn(async (id: string, extension: string) => `${id}.${extension}`),
    isFailing: vi.fn(() => false),
    findRecord: vi.fn(
      async (): Promise<PosterRecord | null> => ({ poster: `/images/${ID}.jpg`, posterSource: SOURCE }),
    ),
    setPosterPath: vi.fn(async () => {}),
    hasSession: vi.fn(async () => true),
    ...overrides,
  }

  const app = createImageController(deps)

  return { deps, handle: app.handle as unknown as Handler }
}

const request = (fileName: string, cookie?: string) =>
  new Request(`http://localhost/images/${fileName}`, cookie ? { headers: { cookie } } : undefined)

describe('GET /images/:fileName', () => {
  it('serves a stored file without touching the network', async () => {
    // arrange
    const { deps, handle } = setup({ read: async () => ({ bytes: JPEG, contentType: 'image/jpeg', etag: '"abc"' }) })

    // act
    const response = await handle(request(`${ID}.jpg`))

    // assert
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('image/jpeg')
    expect(response.headers.get('cache-control')).toBe('public, no-cache')
    expect(deps.download).not.toHaveBeenCalled()
  })

  it('answers 304 when the stored file matches the validator', async () => {
    // arrange
    const { handle } = setup({ read: async () => ({ bytes: JPEG, contentType: 'image/jpeg', etag: '"abc"' }) })

    // act
    const response = await handle(
      new Request(`http://localhost/images/${ID}.jpg`, { headers: { 'if-none-match': '"abc"' } }),
    )

    // assert
    expect(response.status).toBe(304)
    expect(response.headers.get('etag')).toBe('"abc"')
  })

  it('re-sends the bytes when the validator does not match', async () => {
    // arrange
    const { handle } = setup({ read: async () => ({ bytes: JPEG, contentType: 'image/jpeg', etag: '"abc"' }) })

    // act
    const response = await handle(
      new Request(`http://localhost/images/${ID}.jpg`, { headers: { 'if-none-match': '"stale"' } }),
    )

    // assert
    expect(response.status).toBe(200)
    expect(response.headers.get('etag')).toBe('"abc"')
  })

  it('rejects a name that is not an image file', async () => {
    // arrange
    const { deps, handle } = setup()

    // act
    const response = await handle(request('movie-1.exe'))

    // assert
    expect(response.status).toBe(404)
    expect(deps.findRecord).not.toHaveBeenCalled()
  })

  it('returns 404 for an unknown record', async () => {
    // arrange
    const { deps, handle } = setup({ findRecord: async () => null })

    // act
    const response = await handle(request('unknown.jpg'))

    // assert
    expect(response.status).toBe(404)
    expect(deps.hasSession).not.toHaveBeenCalled()
  })

  it('returns 404 when the record has no source', async () => {
    // arrange
    const { handle } = setup({ findRecord: async () => ({ poster: null, posterSource: null }) })

    // act
    const response = await handle(request(`${ID}.jpg`))

    // assert
    expect(response.status).toBe(404)
  })

  it('redirects to the source when there is no session, without downloading', async () => {
    // arrange
    const { deps, handle } = setup({ hasSession: async () => false })

    // act
    const response = await handle(request(`${ID}.jpg`))

    // assert
    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toBe(SOURCE)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(deps.download).not.toHaveBeenCalled()
  })

  it('downloads, stores and serves the bytes for a signed-in request', async () => {
    // arrange
    const { deps, handle } = setup()

    // act
    const response = await handle(request(`${ID}.jpg`, 'auth-session=abc'))

    // assert
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('image/jpeg')
    // The body is served straight from the download; no second read from disk.
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(JPEG)
    expect(deps.save).toHaveBeenCalledExactlyOnceWith(ID, 'jpg', JPEG)
  })

  it('does not set an etag on a fresh download', async () => {
    // arrange
    const { handle } = setup()

    // act
    const response = await handle(request(`${ID}.jpg`, 'auth-session=abc'))

    // assert
    expect(response.headers.get('etag')).toBeNull()
  })

  it('patches the row when the stored extension differs', async () => {
    // arrange
    const { deps, handle } = setup({
      download: async () => ({ bytes: JPEG, extension: 'png' as const }),
      save: async (id: string, extension: string) => `${id}.${extension}`,
    })

    // act
    const response = await handle(request(`${ID}.jpg`, 'auth-session=abc'))

    // assert
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('image/png')
    expect(deps.setPosterPath).toHaveBeenCalledExactlyOnceWith(ID, `/images/${ID}.png`)
  })

  it('redirects to the current path when the requested extension is stale', async () => {
    // arrange
    const { deps, handle } = setup({ findRecord: async () => ({ poster: `/images/${ID}.png`, posterSource: SOURCE }) })

    // act
    const response = await handle(request(`${ID}.jpg`))

    // assert
    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toBe(`/images/${ID}.png`)
    expect(deps.download).not.toHaveBeenCalled()
  })

  it('falls back to the source when the download fails', async () => {
    // arrange
    const { deps, handle } = setup({
      download: async () => {
        throw new Error('boom')
      },
    })

    // act
    const response = await handle(request(`${ID}.jpg`, 'auth-session=abc'))

    // assert
    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toBe(SOURCE)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(deps.save).not.toHaveBeenCalled()
  })

  it('skips the download while the source is marked as failing', async () => {
    // arrange
    const { deps, handle } = setup({ isFailing: () => true })

    // act
    const response = await handle(request(`${ID}.jpg`, 'auth-session=abc'))

    // assert
    expect(response.status).toBe(302)
    expect(deps.download).not.toHaveBeenCalled()
  })
})
