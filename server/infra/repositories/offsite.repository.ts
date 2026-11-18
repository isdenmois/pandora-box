/** Days of dailies kept in the database; anything older is deleted after a successful write. */
export const OFFSITE_RETENTION = 14

/** Long enough for a few hundred KB over a slow link, short enough to fail a dead connection. */
const REQUEST_TIMEOUT_MS = 20_000

/**
 * Realtime Database keys reject `.`, so the day is the finest granularity a key can carry;
 * `2026-11-18` also sorts lexicographically, which makes "newest N" a plain string sort.
 */
export function offsiteKey(date = new Date()): string {
  return date.toISOString().slice(0, 10)
}

export interface OffsiteBackupOptions {
  /** Database root, without a trailing slash. */
  dbUrl: string
  /** Exchanges a service-account assertion for an access token; called per request, cached upstream. */
  token: () => Promise<string>
  fetch?: typeof fetch
}

export function createOffsiteBackupRepository(options: OffsiteBackupOptions) {
  const request = options.fetch ?? globalThis.fetch
  const base = options.dbUrl.replace(/\/+$/, '')

  const send = async (path: string, init: RequestInit) => {
    const accessToken = await options.token()

    const response = await request(`${base}${path}`, {
      ...init,
      // A header, not `?access_token=`: the token then never lands in a URL or an access log.
      headers: { ...init.headers, authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })

    if (!response.ok) {
      // The body carries the reason (`Permission denied`, `Invalid token`); keep it short.
      const detail = await response.text().catch(() => '')

      throw new Error(
        `Realtime Database ${init.method ?? 'GET'} ${path} failed: ${response.status}${detail ? ` ${detail.slice(0, 200)}` : ''}`,
      )
    }

    return response
  }

  /** Newest first. A database with no backups answers `null`, not an empty object. */
  const list = async (): Promise<string[]> => {
    const response = await send('/backups.json?shallow=true', { method: 'GET' })
    const keys = (await response.json()) as Record<string, true> | null

    return Object.keys(keys ?? {}).sort((left, right) => right.localeCompare(left))
  }

  return {
    /** Overwrites the key with the payload and reports its JSON size in bytes. */
    async put(key: string, data: unknown): Promise<number> {
      const body = JSON.stringify(data)

      await send(`/backups/${key}.json`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body,
      })

      return Buffer.byteLength(body)
    },

    list,

    /** Drops everything past the newest `keep` keys and reports what went, oldest first. */
    async prune(keep: number): Promise<string[]> {
      // The listing is newest first, so the tail is the oldest window; reverse it so a run that
      // stops halfway still removed the entries we cared about least.
      const stale = (await list()).slice(keep).reverse()

      for (const key of stale) {
        await send(`/backups/${key}.json`, { method: 'DELETE' })
      }

      return stale
    },
  }
}

export type OffsiteBackupRepository = ReturnType<typeof createOffsiteBackupRepository>
