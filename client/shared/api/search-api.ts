import { http } from './http'
import type { SearchItem, SearchItemDetails } from '../../../server/domain/search-provider'

const v1 = http.url('/v1/search')

export type { SearchItem, SearchItemDetails }

export const search = {
  external: (q: string, provider = 'omdb') => v1.query({ q }).get(`/external/${provider}`).json<SearchItem[]>(),
  byId: (id: string, provider = 'omdb') => v1.get(`/external/${provider}/${id}`).json<SearchItemDetails>(),
}
