import { sequence } from '@sveltejs/kit/hooks';
import * as auth from '$lib/server/auth';
import { redirect, type Handle } from '@sveltejs/kit';
import { paraglideMiddleware } from '$lib/paraglide/server';

const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request;

		return resolve(event, {
			transformPageChunk: ({ html }) => html.replace('%paraglide.lang%', locale)
		});
	});

const handleAuth: Handle = async ({ event, resolve }) => {
	const sessionToken = event.cookies.get(auth.sessionCookieName);
	const route = event.route.id;

	if (!route?.startsWith('/login') && !sessionToken) {
		throw redirect(302, '/login');
	}

	if (!sessionToken) {
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	const { session, user } = await auth.validateSessionToken(sessionToken);

	if (session) {
		auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);
	} else {
		auth.deleteSessionTokenCookie(event);
	}

	if (route?.startsWith('/admin') && user?.role !== 'admin') {
		throw redirect(302, '/');
	}

	event.locals.user = user;
	event.locals.session = session;

	return resolve(event);
};

export const handle: Handle = sequence(handleParaglide, handleAuth);
