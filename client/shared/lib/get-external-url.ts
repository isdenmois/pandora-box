const externalUrls = {
  omdb: {
    link: 'https://www.imdb.com/title/{id}',
    season: 'https://www.imdb.com/title/{id}/episodes/?season={season}',
  },
} as const

export function getExternalUrl(provider: string, id: string, season?: number | null) {
  if (provider in externalUrls) {
    const data = externalUrls[provider as keyof typeof externalUrls]

    if (season) {
      return data.season.replace('{id}', id).replace('{season}', String(season))
    }

    return data.link.replace('{id}', id)
  }

  return null
}
