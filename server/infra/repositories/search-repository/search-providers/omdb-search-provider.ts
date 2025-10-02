import * as v from 'valibot'
import Wretch from 'wretch'
import QueryStringAddon from 'wretch/addons/queryString'
import { SearchItem, SearchProvider } from '@/domain'
import { env } from '@/infra/env'

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
            poster: item.Poster || null,
            year: item.Year ? parseInt(item.Year) : null,
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
    delete extra['Metascore']
    delete extra['Ratings']
    delete extra['Response']
    delete extra['Awards']

    return {
      id: imdbID,
      provider: 'omdb',
      title: Title,
      type: Type,
      poster: Poster || null,
      year: Year ? parseInt(Year) : null,
      rating: imdbRating ? parseFloat(imdbRating) : null,
      genre: Genre || null,
      language: Language || null,
      extra,
    }
  },
}
