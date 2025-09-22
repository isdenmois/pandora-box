import * as v from 'valibot'
import Wretch from 'wretch'
import QueryStringAddon from 'wretch/addons/queryString'
import { env } from '../../../shared/env'
import { SearchItem, SearchProvider } from '../types'

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

const searchParse = v.parser(SearchSchema)

export const omdbProvider: SearchProvider = {
  async search(query, type) {
    const result = await api.query({ s: query, type }).get().json()

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
    return await api.query({ i: id }).get().json()
  },
}
