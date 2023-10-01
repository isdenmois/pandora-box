import { migrate } from 'drizzle-orm/libsql/migrator'
import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'

const client = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
})
const db = drizzle(client)

console.log('Running migrations')

await migrate(db, { migrationsFolder: 'migrations' })

console.log('Migrated successfully')
