import { SearchProvider } from '../../../domain'
import { SearchItemType } from '../../../modules/search/types'
import { omdbSearchProvider } from './search-providers'

const providers = {
  omdb: omdbSearchProvider,
} satisfies Record<string, SearchProvider>

type Provider = keyof typeof providers

export const searchRepository = {
  search(provider: Provider, query: string, type?: SearchItemType, year?: number) {
    return providers[provider].search(query, type, year)
  },

  getById(provider: Provider, id: string) {
    return providers[provider].getById(id)
  },
}
