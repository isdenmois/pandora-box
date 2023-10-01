import { number, coerce, object, string, optional, nullish, transform, type Output, array, parse } from 'valibot'
import { api } from './api'

const IMAGE_PREFIX = 'https://artworks.thetvdb.com'

const searchItemSchema = object({
  id: coerce(number(), Number),
  image: transform(nullish(string()), (image) => (image ? `${IMAGE_PREFIX}${image}` : null)),
  seriesName: string(),
  overview: optional(string()),
  network: nullish(string()),
  firstAired: transform(optional(string()), (date) => (date ? new Date(date) : null)),
})

export type SeriesSearchItem = Output<typeof searchItemSchema>

const searchSchema = array(searchItemSchema)

export const search = (name: string, language = 'en') =>
  api
    .query({ name })
    .headers({ 'Accept-Language': language })
    .get('search/series')
    .then((data: unknown) => parse(searchSchema, data))
