import * as v from 'valibot'
import Wretch from 'wretch'
import QueryStringAddon from 'wretch/addons/queryString'
import { env } from '../../../env'
import { SearchItem, SearchProvider } from '../../../../domain'

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

// by ID
//{
//   "Title": "Black Mirror",
//   "Year": "2011–",
//   "Rated": "TV-MA",
//   "Released": "04 Dec 2011",
//   "Runtime": "60 min",
//   "Genre": "Crime, Drama, Mystery",
//   "Director": "N/A",
//   "Writer": "Charlie Brooker",
//   "Actors": "Anjana Vasan, Cristin Milioti, Jimmi Simpson",
//   "Plot": "Featuring stand-alone dramas -- sharp, suspenseful, satirical tales that explore techno-paranoia -- \"Black Mirror\" is a contemporary reworking of \"The Twilight Zone\" with stories that tap into the collective unease about the moder...",
//   "Language": "English",
//   "Country": "United Kingdom",
//   "Awards": "Won 6 Primetime Emmys. 48 wins & 155 nominations total",
//   "Poster": "https://m.media-amazon.com/images/M/MV5BODcxMWI2NDMtYTc3NC00OTZjLWFmNmUtM2NmY2I1ODkxYzczXkEyXkFqcGc@._V1_SX300.jpg",
//   "Ratings": [
//     {
//       "Source": "Internet Movie Database",
//       "Value": "8.7/10"
//     }
//   ],
//   "Metascore": "N/A",
//   "imdbRating": "8.7",
//   "imdbVotes": "708,105",
//   "imdbID": "tt2085059",
//   "Type": "series",
//   "totalSeasons": "7",
//   "Response": "True"
// }

const searchParse = v.parser(SearchSchema)

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
    return await api.query({ i: id }).get().json()
  },
}
