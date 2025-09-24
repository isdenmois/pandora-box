import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core'

export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  role: text('role').default('user'),
  age: integer('age'),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
})

export type User = typeof user.$inferSelect
