import type { LayoutServerLoad } from './$types';

export const load = (async ({ locals }) => {
	return {
		username: locals.user.username
	};
}) satisfies LayoutServerLoad;
