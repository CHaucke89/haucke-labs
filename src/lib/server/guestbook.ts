import { env } from 'cloudflare:workers';
import type { ProviderId, SessionUser } from '#lib/auth.ts';
import type { GuestbookEntry, GuestbookState } from '#lib/guestbook.ts';

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

/** Previews have no DB binding. */
export const guestbookAvailable = () => Boolean(env.DB);

export async function loadGuestbook(user: SessionUser | null): Promise<GuestbookState> {
	if (!env.DB) return { entries: [], mine: null, available: false, user };

	const [{ results }, mine] = await Promise.all([
		env.DB.prepare('SELECT * FROM guestbook ORDER BY created_at DESC LIMIT ?').bind(PAGE_SIZE).all<Row>(),
		user
			? env.DB.prepare('SELECT * FROM guestbook WHERE provider = ? AND provider_user_id = ?')
					.bind(user.provider, user.id)
					.first<Row>()
			: null
	]);
	return { entries: results.map(toEntry), mine: mine ? toEntry(mine) : null, available: true, user };
}

/** Inserts or updates the visitor's note; false while the edit cooldown is still running. */
export async function saveNote(user: SessionUser, message: string): Promise<boolean> {
	const now = new Date().toISOString();
	const cutoff = new Date(Date.now() - EDIT_COOLDOWN_MS).toISOString();
	// The WHERE on the update enforces the cooldown in the same statement, so two quick
	// submits can't both get through.
	const { meta } = await env.DB.prepare(
		`INSERT INTO guestbook (provider, provider_user_id, name, avatar_url, message, created_at, updated_at)
		 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6)
		 ON CONFLICT (provider, provider_user_id) DO UPDATE
		 SET name = excluded.name, avatar_url = excluded.avatar_url, message = excluded.message,
		     updated_at = excluded.updated_at
		 WHERE guestbook.updated_at < ?7`
	)
		.bind(user.provider, user.id, user.name, user.avatar, message, now, cutoff)
		.run();
	return meta.changes > 0;
}

export async function deleteNote(user: SessionUser): Promise<void> {
	await env.DB.prepare('DELETE FROM guestbook WHERE provider = ? AND provider_user_id = ?')
		.bind(user.provider, user.id)
		.run();
}

export const COOLDOWN_ERROR = 'You just saved a note. Try again in a minute.';
