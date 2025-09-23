export interface SearchItem {
  id: string
  title: string
  type: 'movie' | 'series'
  poster?: string | null
  year?: number | null
}

export interface SearchProvider {
  search: (query: string, type?: SearchItem['type'], year?: number) => Promise<SearchItem[]>
  getById: (id: string) => unknown
}
