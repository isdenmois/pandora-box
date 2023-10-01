import { libsql } from '@lucia-auth/adapter-sqlite';
import { lucia } from 'lucia';
import { sveltekit } from 'lucia/middleware';
import { client } from './db';

export const auth = lucia({
	adapter: libsql(client, {
		user: 'user',
		key: 'user_key',
		session: 'user_session'
	}),
	env: process.env.NODE_ENV === 'production' ? 'PROD' : 'DEV',
	middleware: sveltekit(),
	getUserAttributes: (user) => ({
		userId: user.id,
		username: user.username,
		avatar: user.avatar
	})
});

export type Auth = typeof auth;
