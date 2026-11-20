import { json } from '@sveltejs/kit';
import { cleanMessage } from '#lib/guestbook.ts';
import { COOLDOWN_ERROR, deleteNote, guestbookAvailable, loadGuestbook, saveNote } from '#lib/server/guestbook.ts';
import type { RequestHandler } from './$types';

export const prerender = false;

const NO_STORE = { 'cache-control': 'private, no-store' };

const fail = (status: number, error: string) => json({ error }, { status, headers: NO_STORE });
const state = async (locals: App.Locals) => json(await loadGuestbook(locals.user), { headers: NO_STORE });

export const GET: RequestHandler = ({ locals }) => state(locals);

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) return fail(401, 'Sign in to leave a note.');
	if (!guestbookAvailable()) return fail(503, 'The guestbook is unavailable.');
	// Requiring JSON means a cross-site request needs a CORS preflight, which this route never answers.
	if (!request.headers.get('content-type')?.startsWith('application/json')) {
		return fail(415, 'Send JSON.');
	}

	let body: { message?: unknown };
	try {
		body = await request.json();
	} catch {
		return fail(400, 'Body must be JSON.');
	}
	const result = cleanMessage(body?.message);
	if ('error' in result) return fail(400, result.error);
	if (!(await saveNote(locals.user, result.message))) return fail(429, COOLDOWN_ERROR);
	return state(locals);
};

export const DELETE: RequestHandler = async ({ locals }) => {
	if (!locals.user) return fail(401, 'Sign in first.');
	if (!guestbookAvailable()) return fail(503, 'The guestbook is unavailable.');
	await deleteNote(locals.user);
	return state(locals);
};
