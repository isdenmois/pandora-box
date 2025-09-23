import * as v from 'valibot'

const EnvSchema = v.object({
  DATABASE_URL: v.pipe(v.string(), v.nonEmpty()),
  OMDB_URL: v.pipe(v.string(), v.url()),
})

export const env = v.parse(EnvSchema, process.env)
