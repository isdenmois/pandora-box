import * as v from 'valibot'

const title = v.pipe(v.string(), v.minLength(1))
const poster = v.nullable(v.pipe(v.string(), v.minLength(1)))
const year = v.nullable(v.pipe(v.number(), v.integer(), v.minValue(1)))

export const createMovieBody = v.object({
  extId: v.nullable(v.string()),
  provider: v.picklist(['omdb', 'manual']),
  title,
  poster,
  year,
  rating: v.nullable(v.number()),
  language: v.nullable(v.string()),
  genre: v.nullable(v.string()),
  reason: v.nullable(v.string()),
  recommendedBy: v.nullable(v.string()),
  private: v.boolean(),
  scheduled: v.nullable(v.pipe(v.number(), v.integer())),
  tags: v.nullable(v.array(v.string())),
  extra: v.any(),
})

export const updateMovieBody = v.object({
  title,
  poster,
  year,
  rating: v.nullable(v.number()),
  reason: v.nullable(v.string()),
  recommendedBy: v.nullable(v.string()),
  private: v.boolean(),
  scheduled: v.nullable(v.pipe(v.number(), v.integer())),
  tags: v.nullable(v.array(v.string())),
})

export const patchMovieBody = v.partial(updateMovieBody)

export const markMovieViewedBody = v.object({
  date: v.pipe(v.string(), v.minLength(5)),
  rating: v.pipe(v.number(), v.minValue(0), v.maxValue(10)),
  comment: v.string(),
})
