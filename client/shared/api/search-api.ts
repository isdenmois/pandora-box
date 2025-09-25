import { http } from './http'
import type { SearchItem } from '../../../server/domain/search-provider'

const v1 = http.url('/v1/search')

export type { SearchItem }

export const search = {
  external: (q: string, provider = 'omdb') => v1.query({ q }).get(`/external/${provider}`).json<SearchItem[]>(),
}
