import { sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { user } from './auth'

export const movies = sqliteTable('movies', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
})
