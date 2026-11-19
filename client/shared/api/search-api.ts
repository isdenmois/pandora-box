import type { SearchAppType } from '@server/views/http/app-type'
import type { SearchItem, SearchItemDetails } from '@/server/search-provider'
import { createClient } from './client'
import { unwrap } from './request'

export type { SearchItem, SearchItemDetails }

const searchClient = createClient<SearchAppType>('/api/v1/search')

export const search = {
  external: async (q: string, provider: 'omdb' = 'omdb') =>
    unwrap(await searchClient.external[':provider'].$get({ param: { provider }, query: { q } })),
  byId: async (id: string, provider: 'omdb' = 'omdb') =>
    unwrap(await searchClient.external[':provider'][':id'].$get({ param: { provider, id } })),
}
