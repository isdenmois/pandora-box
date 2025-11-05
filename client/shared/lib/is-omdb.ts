interface OmdbData {
  provider: 'omdb'
  extra: {
    Actors?: string
    Runtime?: string
    Director?: string
    totalSeasons?: string
  }
}

export const isOmdb = <T extends { provider?: string | null }>(data: T): data is T & OmdbData => {
  return data.provider === 'omdb'
}

export const isOmdbString = (value: unknown): value is string => {
  return typeof value === 'string' && value !== 'N/A'
}
