import { Database } from 'bun:sqlite'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import { migrate } from 'drizzle-orm/bun-sqlite/migrator'
import { schema } from '@/domain'
import { env } from '@/infra/env'

const client = new Database(env.DATABASE_URL)
// References are declared in the schema for documentation and future enforcement, but the app
// validates them itself. SQLite defaults to off; state it so a migration cannot flip it on.
client.run('PRAGMA foreign_keys = OFF')

export const db = drizzle(client, { schema })

await migrate(db, { migrationsFolder: './drizzle' })
