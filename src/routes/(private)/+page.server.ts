import { deleteUser, getUsers } from '$lib/server/db';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { auth } from '$lib/server/lucia';

export const load = (async ({ locals }) => {
	const user = await locals.user;

	return {
		users: await getUsers(),
		user
	};
}) satisfies PageServerLoad;

export const actions = {
	logout: async ({ locals }) => {
		const session = await locals.auth.validate();
		if (!session) return fail(401);
		await auth.invalidateSession(session.sessionId); // invalidate session
		locals.auth.setSession(null); // remove cookie
	},
	delete: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id') as string;

		await deleteUser(id);

		return { success: true };
	}
} satisfies Actions;
