const externalUrls = {
  omdb: 'https://www.imdb.com/title/{id}',
} as const

export function getExternalUrl(provider: string, id: string) {
  if (provider in externalUrls) {
    return externalUrls[provider as keyof typeof externalUrls].replace('{id}', id)
  }

  return null
}
