/** Create payloads for the two record routes; they differ only where the domain does. */
export function moviePayload(overrides: Record<string, unknown> = {}) {
  return {
    extId: null,
    provider: 'manual',
    title: 'A Movie',
    poster: null,
    year: 2024,
    rating: null,
    language: null,
    genre: null,
    reason: null,
    recommendedBy: null,
    private: false,
    scheduled: null,
    tags: null,
    extra: {},
    ...overrides,
  }
}

export function seriesPayload(overrides: Record<string, unknown> = {}) {
  return { ...moviePayload(overrides), season: 1, ...overrides }
}

export interface RecordResource {
  name: string
  /** Path below `/api`. */
  path: string
  create: (overrides?: Record<string, unknown>) => Record<string, unknown>
}

/** Both routes share the visibility, ownership and view rules, so one scenario table fits both. */
export const resources: RecordResource[] = [
  { name: 'movie', path: '/v1/movie', create: moviePayload },
  { name: 'series', path: '/v1/series', create: seriesPayload },
]
