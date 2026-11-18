import { beforeEach, describe, expect, it, vi } from 'vitest'

// The controller module also builds the production instance, which reaches the database through
// `@/infra`; stubbing it keeps these tests free of bun:sqlite.
vi.mock('@/infra', () => ({
  env: { IMAGE_MAX_BYTES: 5 * 1024 * 1024 },
  movieRepository: { byId: vi.fn(), update: vi.fn() },
  posterRepository: { save: vi.fn(), remove: vi.fn() },
}))

// The guard is a plugin, so the stub has to be one too — a `derive` is enough to let requests in.
vi.mock('@/views/auth', async () => {
  const { Elysia } = await import('elysia')

  return { authGuard: new Elysia({ name: 'auth guard' }).derive(() => ({ user: { id: 'user-1' } })) }
})

const { movieRepository, posterRepository } = await import('@/infra')
const { movieController } = await import('../movie.controller')

const ID = 'movie-1'
const ROW = { id: ID, title: 'New Title', poster: `/images/${ID}.png`, posterSource: null }

/** A 1x1 png; it carries the IEND marker the server checks for truncation. */
const PIXEL = Uint8Array.from(
  atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='),
  (char) => char.charCodeAt(0),
)

type Handler = (request: Request) => Promise<Response>

const handle = movieController.handle as unknown as Handler

function upload(options: { data?: string; file?: File | null; id?: string } = {}) {
  const form = new FormData()
  form.append('data', options.data ?? JSON.stringify({ title: 'New Title' }))

  if (options.file !== null) {
    form.append('file', options.file ?? new File([PIXEL], 'poster.png', { type: 'image/png' }))
  }

  return new Request(`http://localhost/v1/movie/${options.id ?? ID}/poster`, { method: 'PATCH', body: form })
}

describe('PATCH /v1/movie/:id/poster', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(movieRepository.byId).mockResolvedValue(ROW as never)
    vi.mocked(movieRepository.update).mockResolvedValue(ROW as never)
    vi.mocked(posterRepository.save).mockResolvedValue(`${ID}.png`)
    vi.mocked(posterRepository.remove).mockResolvedValue()
  })

  it('stores the uploaded image and answers with the updated record', async () => {
    // arrange
    // act
    const response = await handle(upload())

    // assert
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual(ROW)
    // The extension comes from the bytes, never from the file name the client chose.
    expect(posterRepository.save).toHaveBeenCalledWith(ID, 'png', expect.any(Uint8Array))
    expect(movieRepository.update).toHaveBeenCalledWith(ID, { title: 'New Title' }, `/images/${ID}.png`)
  })

  it('rejects a payload that does not satisfy the update contract', async () => {
    // arrange
    // act
    const response = await handle(upload({ data: JSON.stringify({ title: '' }) }))

    // assert
    expect(response.status).toBe(422)
    expect(posterRepository.save).not.toHaveBeenCalled()
  })

  it('rejects a data part that is not JSON', async () => {
    // arrange
    // act
    const response = await handle(upload({ data: '{' }))

    // assert
    expect(response.status).toBe(422)
    expect(posterRepository.save).not.toHaveBeenCalled()
  })

  it('rejects a file whose bytes are not an allowed image', async () => {
    // arrange
    const notAnImage = new File([new TextEncoder().encode('<html>not an image</html>')], 'poster.png', {
      type: 'image/png',
    })

    // act
    const response = await handle(upload({ file: notAnImage }))

    // assert
    expect(response.status).toBe(422)
    expect(posterRepository.save).not.toHaveBeenCalled()
  })

  it('rejects a file over the size cap', async () => {
    // arrange
    // A real png header and IEND marker, so only the size check can reject it.
    const oversize = new Uint8Array(5 * 1024 * 1024 + 1)
    oversize.set(PIXEL.subarray(0, 8))
    oversize.set(PIXEL.subarray(PIXEL.length - 8), oversize.length - 8)
    const file = new File([oversize], 'poster.png', { type: 'image/png' })

    // act
    const response = await handle(upload({ file }))

    // assert
    expect(response.status).toBe(422)
    expect(posterRepository.save).not.toHaveBeenCalled()
  })

  it('rejects a truncated image', async () => {
    // arrange
    const truncated = new File([PIXEL.slice(0, PIXEL.length - 8)], 'poster.png', { type: 'image/png' })

    // act
    const response = await handle(upload({ file: truncated }))

    // assert
    expect(response.status).toBe(422)
    expect(posterRepository.save).not.toHaveBeenCalled()
  })

  it('answers 404 for an id that no record holds', async () => {
    // arrange
    vi.mocked(movieRepository.byId).mockResolvedValue(null)

    // act
    const response = await handle(upload())

    // assert
    expect(response.status).toBe(404)
    expect(posterRepository.save).not.toHaveBeenCalled()
  })

  it('requires the file part', async () => {
    // arrange
    // act
    const response = await handle(upload({ file: null }))

    // assert
    expect(response.status).toBe(422)
  })
})
