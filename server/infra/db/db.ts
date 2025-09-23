import { drizzle } from 'drizzle-orm/bun-sqlite'
import { migrate } from 'drizzle-orm/bun-sqlite/migrator'
import { Database } from 'bun:sqlite'
import { schema } from '../models'
import { env } from '../env'

const client = new Database(env.DATABASE_URL)

export const db = drizzle(client, { schema })

await migrate(db, { migrationsFolder: './drizzle' })
