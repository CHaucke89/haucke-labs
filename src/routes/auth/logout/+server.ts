import { redirect } from '@sveltejs/kit';
import { clearSession, safeNext } from '#lib/server/session.ts';
import type { RequestHandler } from './$types';

export const prerender = false;

// POST only, so a link or <img> on another site can't sign visitors out. SvelteKit rejects
// cross-origin form posts on its own.
export const POST: RequestHandler = async ({ request, cookies }) => {
	clearSession(cookies);
	const form = await request.formData();
	redirect(303, safeNext(form.get('next')?.toString()));
};
