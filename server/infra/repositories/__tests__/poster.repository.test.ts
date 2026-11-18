import { mkdtemp, rm, utimes, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createPosterRepository } from '../poster.repository'

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xd9])

let dir = ''

const createRepository = (overrides: Partial<Parameters<typeof createPosterRepository>[0]> = {}) =>
  createPosterRepository({ dir, enabled: true, maxBytes: 1024, ...overrides })

describe('poster repository', () => {
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'posters-'))
  })

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  it('round-trips bytes with a valid content type', async () => {
    // arrange
    const repository = createRepository()

    // act
    const fileName = await repository.save('movie-1', 'jpg', JPEG)
    const stored = await repository.read(fileName)

    // assert
    expect(fileName).toBe('movie-1.jpg')
    expect(stored?.bytes).toEqual(JPEG)
    expect(stored?.contentType).toBe('image/jpeg')
  })

  it('derives a validator that changes with the bytes', async () => {
    // arrange
    const repository = createRepository()

    // act
    const first = await repository.read(await repository.save('movie-1', 'jpg', JPEG))
    const second = await repository.read(await repository.save('movie-1', 'jpg', new Uint8Array([1, 2, 3])))

    // assert
    expect(first?.etag).toMatch(/^".+"$/)
    expect(second?.etag).not.toBe(first?.etag)
  })

  it('returns null for a missing file', async () => {
    // arrange
    const repository = createRepository()

    // act + assert
    expect(await repository.read('nope.jpg')).toBeNull()
  })

  it('drops the other extensions of the same record on save', async () => {
    // arrange
    const repository = createRepository()
    await repository.save('movie-1', 'jpg', JPEG)

    // act
    await repository.save('movie-1', 'png', JPEG)

    // assert
    expect(await repository.read('movie-1.jpg')).toBeNull()
    expect((await repository.read('movie-1.png'))?.bytes).toEqual(JPEG)
  })

  it('removes every file of a record', async () => {
    // arrange
    const repository = createRepository()
    await repository.save('movie-1', 'jpg', JPEG)
    await repository.save('movie-2', 'jpg', JPEG)

    // act
    await repository.remove('movie-1')

    // assert
    expect(await repository.read('movie-1.jpg')).toBeNull()
    expect(await repository.read('movie-2.jpg')).not.toBeNull()
  })

  it('removing a record that has no file is not an error', async () => {
    // arrange
    const repository = createRepository()

    // act + assert
    await expect(repository.remove('missing')).resolves.toBeUndefined()
  })

  it('lists only unreferenced image files as orphans', async () => {
    // arrange
    const repository = createRepository()
    await repository.save('kept', 'jpg', JPEG)
    await repository.save('orphan', 'png', JPEG)
    // A save in flight owns its temp file, so a fresh one must never be offered for deletion.
    await writeFile(join(dir, 'pending.jpg.tmp'), JPEG)
    await writeFile(join(dir, 'notes.txt'), 'x')

    // act
    const orphans = await repository.listOrphans(new Set(['kept']))

    // assert
    expect(orphans).toEqual(['orphan.png'])
  })

  it('sweeps a temp file left behind by a crashed write', async () => {
    // arrange
    const repository = createRepository()
    const stale = join(dir, 'crashed.jpg.tmp')
    await writeFile(stale, JPEG)
    await utimes(stale, new Date(0), new Date(0))

    // act
    const orphans = await repository.listOrphans(new Set())

    // assert
    expect(orphans).toEqual(['crashed.jpg.tmp'])
  })

  it('sweeps a jpeg even while its record still exists', async () => {
    // arrange
    // Nothing writes `jpeg` (it is normalized to `jpg`), so the file can only be a leftover.
    const repository = createRepository()
    await repository.save('kept', 'jpg', JPEG)
    await writeFile(join(dir, 'kept.jpeg'), JPEG)

    // act
    const orphans = await repository.listOrphans(new Set(['kept']))

    // assert
    expect(orphans).toEqual(['kept.jpeg'])
  })

  it('saves the same record twice without losing the write to a shared temp name', async () => {
    // arrange
    // Two requests for one cold miss both reach `save`; the fetcher only shares the download.
    const repository = createRepository()

    // act
    await expect(
      Promise.all([repository.save('movie-1', 'jpg', JPEG), repository.save('movie-1', 'jpg', JPEG)]),
    ).resolves.toEqual(['movie-1.jpg', 'movie-1.jpg'])

    // assert
    expect((await repository.read('movie-1.jpg'))?.bytes).toEqual(JPEG)
    expect(await repository.listOrphans(new Set(['movie-1']))).toEqual([])
  })

  it('removes the orphans it listed and nothing else', async () => {
    // arrange
    const repository = createRepository()
    await repository.save('kept', 'jpg', JPEG)
    await repository.save('orphan', 'jpg', JPEG)

    // act
    const removed = await repository.removeOrphans(new Set(['kept']))

    // assert
    expect(removed).toBe(1)
    expect(await repository.read('orphan.jpg')).toBeNull()
    expect(await repository.read('kept.jpg')).not.toBeNull()
  })

  it('does nothing when the directory does not exist yet', async () => {
    // arrange
    const repository = createRepository({ dir: join(dir, 'missing') })

    // act + assert
    expect(await repository.listOrphans(new Set())).toEqual([])
  })
})
