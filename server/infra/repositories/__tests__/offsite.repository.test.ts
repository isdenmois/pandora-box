import { describe, expect, it, vi } from 'vitest'
import { createOffsiteBackupRepository, OFFSITE_RETENTION, offsiteKey } from '../offsite.repository'

const DB_URL = 'https://box-default-rtdb.europe-west1.firebasedatabase.app'

interface Call {
  url: string
  init: RequestInit
}

const repositoryWith = (handler: (url: string, init: RequestInit) => Response) => {
  const calls: Call[] = []
  const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
    calls.push({ url, init })

    return handler(url, init)
  })

  const repository = createOffsiteBackupRepository({
    // A trailing slash must not double up in the request path.
    dbUrl: `${DB_URL}/`,
    token: async () => 'token-1',
    fetch: fetchMock as unknown as typeof fetch,
  })

  return { repository, calls }
}

/** `count` consecutive day keys starting at 2026-01-01, oldest first. */
const days = (count: number) =>
  Array.from({ length: count }, (_, index) => offsiteKey(new Date(Date.UTC(2026, 0, 1 + index))))

describe('offsiteKey', () => {
  it('keeps only the UTC day, the finest key a Realtime Database accepts', () => {
    // assert
    expect(offsiteKey(new Date('2026-11-18T23:30:00Z'))).toBe('2026-11-18')
    expect(offsiteKey(new Date('2026-11-19T00:10:00Z'))).toBe('2026-11-19')
  })
})

describe('offsite repository', () => {
  it('puts the payload under the day key with the token in an Authorization header', async () => {
    // arrange
    const { repository, calls } = repositoryWith(() => new Response('{}'))

    // act
    const bytes = await repository.put('2026-11-18', { movie: [{ id: 'm1' }] })

    // assert
    expect(calls[0]?.url).toBe(`${DB_URL}/backups/2026-11-18.json`)
    expect(calls[0]?.init.method).toBe('PUT')
    expect(calls[0]?.init.body).toBe('{"movie":[{"id":"m1"}]}')
    expect(calls[0]?.init.headers).toMatchObject({
      authorization: 'Bearer token-1',
      'content-type': 'application/json',
    })
    expect(calls[0]?.url).not.toContain('token-1')
    expect(bytes).toBe(Buffer.byteLength('{"movie":[{"id":"m1"}]}'))
  })

  it('lists the stored keys newest first from a shallow read', async () => {
    // arrange
    const { repository, calls } = repositoryWith(
      () => new Response(JSON.stringify({ '2026-11-16': true, '2026-11-18': true, '2026-11-17': true })),
    )

    // act
    const keys = await repository.list()

    // assert
    expect(keys).toEqual(['2026-11-18', '2026-11-17', '2026-11-16'])
    expect(calls[0]?.url).toBe(`${DB_URL}/backups.json?shallow=true`)
  })

  it('reads an empty database as no keys', async () => {
    // arrange
    const { repository } = repositoryWith(() => new Response('null'))

    // act & assert
    expect(await repository.list()).toEqual([])
  })

  it('deletes only what is older than the retention window', async () => {
    // arrange
    const all = days(OFFSITE_RETENTION + 2)
    const deleted: string[] = []
    const { repository } = repositoryWith((url, init) => {
      if (init.method === 'DELETE') {
        deleted.push(url)

        return new Response('null')
      }

      return new Response(JSON.stringify(Object.fromEntries(all.map((key) => [key, true]))))
    })

    // act
    const pruned = await repository.prune(OFFSITE_RETENTION)

    // assert
    expect(pruned).toEqual(all.slice(0, 2))
    expect(deleted).toEqual(all.slice(0, 2).map((key) => `${DB_URL}/backups/${key}.json`))
  })

  it('reports the status and the body when a write is rejected', async () => {
    // arrange
    const { repository } = repositoryWith(() => new Response('Permission denied', { status: 401 }))

    // act & assert
    await expect(repository.put('2026-11-18', {})).rejects.toThrow(
      'Realtime Database PUT /backups/2026-11-18.json failed: 401 Permission denied',
    )
  })
})
