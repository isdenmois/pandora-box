import * as v from 'valibot'

const title = v.pipe(v.string(), v.minLength(1))
const poster = v.nullable(v.pipe(v.string(), v.minLength(1)))
const year = v.nullable(v.pipe(v.number(), v.integer(), v.minValue(1)))
const season = v.pipe(v.number(), v.integer(), v.minValue(1))

export const createSeriesBody = v.object({
  extId: v.nullable(v.string()),
  provider: v.picklist(['omdb', 'manual']),
  title,
  poster,
  year,
  season,
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

export const updateSeriesBody = v.object({
  title,
  poster,
  year,
  season,
  seasonHistory: v.optional(v.nullable(v.any())),
  rating: v.nullable(v.number()),
  reason: v.nullable(v.string()),
  recommendedBy: v.nullable(v.string()),
  private: v.boolean(),
  scheduled: v.nullable(v.pipe(v.number(), v.integer())),
  tags: v.nullable(v.array(v.string())),
})

export const patchSeriesBody = v.partial(updateSeriesBody)

export const markSeriesViewedBody = v.object({
  date: v.pipe(v.string(), v.minLength(5)),
  rating: v.pipe(v.number(), v.minValue(0), v.maxValue(10)),
  comment: v.string(),
})
