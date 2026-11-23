import { json } from '@sveltejs/kit';
import { cleanConversation } from '#lib/ask.ts';
import { answer, askAvailable, takeQuota } from '#lib/server/ask.ts';
import type { RequestHandler } from './$types';

export const prerender = false;

const NO_STORE = { 'cache-control': 'private, no-store' };

const fail = (status: number, error: string) => json({ error }, { status, headers: NO_STORE });

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	if (!askAvailable()) return fail(503, 'The assistant isn’t available here.');
	// Requiring JSON means a cross-site request needs a CORS preflight, which this route never answers.
	if (!request.headers.get('content-type')?.startsWith('application/json')) {
		return fail(415, 'Send JSON.');
	}

	let body: { messages?: unknown };
	try {
		body = await request.json();
	} catch {
		return fail(400, 'Body must be JSON.');
	}
	const result = cleanConversation(body?.messages);
	if ('error' in result) return fail(400, result.error);

	let limited: string | null;
	try {
		limited = await takeQuota(request.headers.get('cf-connecting-ip') ?? getClientAddress());
	} catch (err) {
		console.error('ask quota failed', err);
		return fail(503, 'The assistant isn’t available right now.');
	}
	if (limited) return fail(429, limited);

	return new Response(answer(result.messages, request.signal), {
		headers: { ...NO_STORE, 'content-type': 'application/x-ndjson; charset=utf-8' }
	});
};
