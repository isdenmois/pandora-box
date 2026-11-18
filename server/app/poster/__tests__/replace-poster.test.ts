import { describe, expect, it, vi } from 'vitest'
import { replacePoster } from '../replace-poster'

const ID = 'movie-1'
const BYTES = new Uint8Array([1, 2, 3])
const FIELDS = { title: 'New Title' }

type Row = { id: string; poster?: string }
type Records = {
  byId: (id: string) => Promise<Row | null>
  update: (id: string, data: typeof FIELDS, path?: string, editorId?: string) => Promise<Row | null>
}

function setup(overrides: Partial<Records> = {}) {
  const records: Records = {
    byId: vi.fn(async () => ({ id: ID })),
    update: vi.fn(async (_id: string, data: typeof FIELDS, path?: string) => ({ id: ID, ...data, poster: path })),
    ...overrides,
  }
  const files = {
    save: vi.fn(async () => `${ID}.png`),
    remove: vi.fn(async () => {}),
  }

  return { records, files }
}

const run = (records: ReturnType<typeof setup>['records'], files: ReturnType<typeof setup>['files']) =>
  replacePoster(records, files, { id: ID, fields: FIELDS, extension: 'png', bytes: BYTES }, 'user-1')

describe('replacePoster', () => {
  it('writes the bytes and points the record at the public path', async () => {
    // arrange
    const { records, files } = setup()

    // act
    const saved = await run(records, files)

    // assert
    expect(files.save).toHaveBeenCalledWith(ID, 'png', BYTES)
    expect(records.update).toHaveBeenCalledWith(ID, FIELDS, `/images/${ID}.png`, 'user-1')
    expect(saved).toMatchObject({ poster: `/images/${ID}.png` })
  })

  it('does not write a file for a record that is gone', async () => {
    // arrange
    const { records, files } = setup({ byId: vi.fn(async () => null) })

    // act
    const saved = await run(records, files)

    // assert
    expect(saved).toBeNull()
    expect(files.save).not.toHaveBeenCalled()
  })

  it('drops the fresh file when the record disappears before the update', async () => {
    // arrange
    const { records, files } = setup({ update: vi.fn(async () => null) })

    // act
    const saved = await run(records, files)

    // assert
    expect(saved).toBeNull()
    expect(files.remove).toHaveBeenCalledWith(ID)
  })

  it('drops the fresh file when the update fails and rethrows', async () => {
    // arrange
    const { records, files } = setup({
      update: vi.fn(async () => {
        throw new Error('db down')
      }),
    })

    // act
    const attempt = run(records, files)

    // assert
    await expect(attempt).rejects.toThrow('db down')
    expect(files.remove).toHaveBeenCalledWith(ID)
  })
})
