import { error, fail, redirect } from '@sveltejs/kit';
import { cleanMessage } from '#lib/guestbook.ts';
import { COOLDOWN_ERROR, deleteNote, guestbookAvailable, loadGuestbook, saveNote } from '#lib/server/guestbook.ts';
import type { Actions, PageServerLoad } from './$types';

export const prerender = false;

export const load: PageServerLoad = ({ locals, setHeaders }) => {
	// The page differs per visitor (the form shows your own note), so no shared caching.
	setHeaders({ 'cache-control': 'private, no-store' });
	return loadGuestbook(locals.user);
};

export const actions: Actions = {
	sign: async ({ request, locals }) => {
		if (!locals.user) error(401, 'Sign in to leave a note');
		if (!guestbookAvailable()) error(503, 'Guestbook is unavailable');

		const result = cleanMessage((await request.formData()).get('message'));
		if ('error' in result) return fail(400, { error: result.error });
		if (!(await saveNote(locals.user, result.message))) return fail(429, { error: COOLDOWN_ERROR });
		return { saved: true };
	},

	delete: async ({ locals }) => {
		if (!locals.user) error(401, 'Sign in first');
		if (!guestbookAvailable()) error(503, 'Guestbook is unavailable');
		await deleteNote(locals.user);
		redirect(303, '/guestbook');
	}
};
