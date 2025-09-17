import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import Database from 'better-sqlite3';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

const client = new Database(env.DATABASE_URL);

export const db = drizzle(client, { schema });

await migrate(db, { migrationsFolder: './drizzle' });
