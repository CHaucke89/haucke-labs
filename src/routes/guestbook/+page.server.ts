import { env } from 'cloudflare:workers';
import { error, fail, redirect } from '@sveltejs/kit';
import type { ProviderId } from '#lib/auth.ts';
import { cleanMessage, type GuestbookEntry } from '#lib/guestbook.ts';
import type { Actions, PageServerLoad } from './$types';

export const prerender = false;

const PAGE_SIZE = 100;
const EDIT_COOLDOWN_MS = 60_000;

interface Row {
	provider: ProviderId;
	provider_user_id: string;
	name: string;
	avatar_url: string | null;
	message: string;
	created_at: string;
	updated_at: string;
}

const toEntry = (r: Row): GuestbookEntry => ({
	provider: r.provider,
	userId: r.provider_user_id,
	name: r.name,
	avatar: r.avatar_url,
	message: r.message,
	createdAt: r.created_at,
	updatedAt: r.updated_at
});

export const load: PageServerLoad = async ({ locals, setHeaders }) => {
	// The page differs per visitor (the form shows your own note), so no shared caching.
	setHeaders({ 'cache-control': 'private, no-store' });
	// Previews have no DB binding.
	if (!env.DB) return { entries: [], mine: null, available: false, user: locals.user };

	const [{ results }, mine] = await Promise.all([
		env.DB.prepare('SELECT * FROM guestbook ORDER BY created_at DESC LIMIT ?').bind(PAGE_SIZE).all<Row>(),
		locals.user
			? env.DB.prepare('SELECT * FROM guestbook WHERE provider = ? AND provider_user_id = ?')
					.bind(locals.user.provider, locals.user.id)
					.first<Row>()
			: null
	]);
	return {
		entries: results.map(toEntry),
		mine: mine ? toEntry(mine) : null,
		available: true,
		user: locals.user
	};
};

export const actions: Actions = {
	sign: async ({ request, locals }) => {
		const user = locals.user;
		if (!user) error(401, 'Sign in to leave a note');
		if (!env.DB) error(503, 'Guestbook is unavailable');

		const result = cleanMessage((await request.formData()).get('message'));
		if ('error' in result) return fail(400, { error: result.error });

		const now = new Date().toISOString();
		const cutoff = new Date(Date.now() - EDIT_COOLDOWN_MS).toISOString();
		// Insert, or update the visitor's existing note. The WHERE on the update enforces the
		// cooldown in the same statement, so two quick submits can't both get through.
		const { meta } = await env.DB.prepare(
			`INSERT INTO guestbook (provider, provider_user_id, name, avatar_url, message, created_at, updated_at)
			 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6)
			 ON CONFLICT (provider, provider_user_id) DO UPDATE
			 SET name = excluded.name, avatar_url = excluded.avatar_url, message = excluded.message,
			     updated_at = excluded.updated_at
			 WHERE guestbook.updated_at < ?7`
		)
			.bind(user.provider, user.id, user.name, user.avatar, result.message, now, cutoff)
			.run();
		if (meta.changes === 0) return fail(429, { error: 'You just saved a note. Try again in a minute.' });
		return { saved: true };
	},

	delete: async ({ locals }) => {
		if (!locals.user) error(401, 'Sign in first');
		if (!env.DB) error(503, 'Guestbook is unavailable');
		await env.DB.prepare('DELETE FROM guestbook WHERE provider = ? AND provider_user_id = ?')
			.bind(locals.user.provider, locals.user.id)
			.run();
		redirect(303, '/guestbook');
	}
};
