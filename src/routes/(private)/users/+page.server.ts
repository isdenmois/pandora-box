import { getUsers } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load = (async () => {
	return {
		users: await getUsers()
	};
}) satisfies PageServerLoad;
