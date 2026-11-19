import type { SearchItem, SearchProvider } from '@server/domain'
import { env } from '@server/infra/env'
import * as v from 'valibot'
import Wretch from 'wretch'
import QueryStringAddon from 'wretch/addons/queryString'

const api = Wretch(env.OMDB_URL).addon(QueryStringAddon)

const SearchItemSchema = v.object({
  imdbID: v.pipe(v.string(), v.nonEmpty()),
  Title: v.pipe(v.string(), v.nonEmpty()),
  Type: v.string(),
  Year: v.optional(v.string()),
  Poster: v.optional(v.string()),
})

const SearchSchema = v.object({
  Search: v.optional(v.array(SearchItemSchema), []),
})

const ByIdSchema = v.looseObject({
  imdbID: v.pipe(v.string(), v.nonEmpty()),
  Title: v.pipe(v.string(), v.nonEmpty()),
  Type: v.string(),
  Year: v.optional(v.string()),
  Poster: v.optional(v.string()),
  imdbRating: v.optional(v.string()),
  Genre: v.optional(v.string()),
  Language: v.optional(v.string()),
})

const searchParse = v.parser(SearchSchema)
const byIdParse = v.parser(ByIdSchema)

/** OMDB spells "no value" as `N/A`; treat it the same as an empty string. */
const valueOrNull = (value: string | undefined) => (value && value !== 'N/A' ? value : null)

const numberOrNull = (value: string | undefined) => {
  const raw = valueOrNull(value)

  if (raw === null) {
    return null
  }

  const parsed = Number.parseFloat(raw)

  return Number.isNaN(parsed) ? null : parsed
}

interface OmdbSearchQuery {
  s: string
  type?: string
  y?: string
}

export const omdbSearchProvider: SearchProvider = {
  async search(s, type, y) {
    const result = await api
      .query({ s, type, y } as OmdbSearchQuery)
      .get()
      .json()

    return searchParse(result)
      .Search.filter((item) => item.Type === 'movie' || item.Type === 'series')
      .map(
        (item) =>
          ({
            id: item.imdbID,
            title: item.Title,
            type: item.Type as 'movie' | 'series',
            poster: valueOrNull(item.Poster),
            year: numberOrNull(item.Year),
          }) satisfies SearchItem,
      )
  },
  async getById(id) {
    const result = await api.query({ i: id }).get().json()
    const { imdbID, Type, Title, Year, Poster, imdbRating, Genre, Language, ...extra } = byIdParse(result)

    if (Type !== 'movie' && Type !== 'series') {
      throw 'Bad type'
    }

    // TODO: use omit
    delete extra.Metascore
    delete extra.Ratings
    delete extra.Response
    delete extra.Awards

    return {
      id: imdbID,
      provider: 'omdb',
      title: Title,
      type: Type,
      poster: valueOrNull(Poster),
      year: numberOrNull(Year),
      rating: numberOrNull(imdbRating),
      genre: valueOrNull(Genre),
      language: valueOrNull(Language),
      extra,
    }
  },
}
