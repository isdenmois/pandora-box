import { createClient } from '@libsql/client'
import { env } from '$env/dynamic/private'
import { drizzle } from 'drizzle-orm/libsql'
import { eq } from 'drizzle-orm'
import { schema, user } from './schema'

export const client = createClient({ url: env.DATABASE_URL, authToken: env.DATABASE_AUTH_TOKEN })

const db = drizzle(client, { schema })

export const getUsers = () => db.select().from(user).all()

export const deleteUser = async (id: string) => {
  await db.delete(user).where(eq(user.id, id))
}
