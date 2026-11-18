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
  /** Realtime Database URL, e.g. `https://<project>-default-rtdb.<region>.firebasedatabase.app`. */
  FIREBASE_DB_URL: v.optional(v.pipe(v.string(), v.url())),
  /** Service-account JSON in base64: the PEM newlines do not survive `.env` or compose otherwise. */
  FIREBASE_SERVICE_ACCOUNT_B64: v.optional(v.pipe(v.string(), v.nonEmpty())),
  /** Bearer token the offsite backup cron sends. Unset keeps the machine endpoint off. */
  BACKUP_TOKEN: v.optional(v.pipe(v.string(), v.minLength(16))),
})

/**
 * Compose turns an unset variable into an empty string, which would trip every `nonEmpty` rule;
 * an empty value means absent, so optional variables fall back to their defaults.
 */
const source = Object.fromEntries(Object.entries(process.env).filter(([, value]) => value))

const {
  DATABASE_URL,
  OMDB_URL,
  IMAGE_DIR,
  IMAGE_MAX_BYTES,
  IMAGE_FETCH,
  FIREBASE_DB_URL,
  FIREBASE_SERVICE_ACCOUNT_B64,
  BACKUP_TOKEN,
} = v.parse(EnvSchema, source)

export const env = {
  DATABASE_URL,
  OMDB_URL,
  IMAGE_DIR,
  IMAGE_MAX_BYTES,
  IMAGE_FETCH,
  FIREBASE_DB_URL,
  FIREBASE_SERVICE_ACCOUNT_B64,
  BACKUP_TOKEN,
}
