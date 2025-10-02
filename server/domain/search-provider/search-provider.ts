export interface SearchItem {
  id: string
  title: string
  type: 'movie' | 'series'
  poster?: string | null
  year?: number | null
}

export interface SearchItemDetails {
  id: string
  provider: string
  title: string
  type: 'movie' | 'series'
  year?: number | null
  poster?: string | null
  rating?: number | null
  genre?: string | null
  language?: string | null
  extra?: object
}

export type SearchItemType = SearchItem['type']

export interface SearchProvider {
  search: (query: string, type?: SearchItem['type'], year?: number) => Promise<SearchItem[]>
  getById: (id: string) => Promise<SearchItemDetails>
}
