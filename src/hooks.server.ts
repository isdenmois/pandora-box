import { auth } from '$lib/server/lucia';
import { redirect, type Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	// we can pass `event` because we used the SvelteKit middleware
	event.locals.auth = auth.handleRequest(event);
	const valid = await event.locals.auth.validate();
	const isPublicRoute = !event.route.id || event.route.id.startsWith('/(public)');

	if (valid) {
		if (isPublicRoute) {
			throw redirect(302, '/');
		}
		event.locals.user = valid.user;
	} else {
		if (!isPublicRoute) {
			throw redirect(302, `/login?redir=${event.url.pathname}`);
		}
	}
	return await resolve(event);
};
