import * as v from 'valibot'

const EnvSchema = v.object({
  DATABASE_URL: v.pipe(v.string(), v.nonEmpty()),
  OMDB_URL: v.pipe(v.string(), v.url()),
  /** Directory the poster files are written to. Must be readable by nginx in production. */
  IMAGE_DIR: v.optional(v.pipe(v.string(), v.nonEmpty()), 'data/images'),
  /** Upper bound in bytes for a single downloaded poster. */
  IMAGE_MAX_BYTES: v.optional(
    v.pipe(
      v.string(),
      v.transform((value) => Number(value)),
      v.number(),
      v.integer(),
      v.minValue(1),
    ),
    '5242880',
  ),
  /** `off` makes cold misses answer 302 to the source without downloading anything. */
  IMAGE_FETCH: v.optional(v.picklist(['on', 'off']), 'on'),
})

const { DATABASE_URL, OMDB_URL, IMAGE_DIR, IMAGE_MAX_BYTES, IMAGE_FETCH } = v.parse(EnvSchema, process.env)

export const env = {
  DATABASE_URL,
  OMDB_URL,
  IMAGE_DIR,
  IMAGE_MAX_BYTES,
  IMAGE_FETCH,
}
