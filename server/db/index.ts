import { drizzle } from 'drizzle-orm/bun-sqlite'
import { migrate } from 'drizzle-orm/bun-sqlite/migrator'
import { Database } from 'bun:sqlite'
import * as schema from './schema'

const client = new Database(process.env.DATABASE_URL)

export const db = drizzle(client, { schema })
export * as table from './schema'

await migrate(db, { migrationsFolder: './drizzle' })
