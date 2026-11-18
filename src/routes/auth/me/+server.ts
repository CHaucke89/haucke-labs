import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// The header is prerendered, so it asks here who is signed in.
export const prerender = false;

export const GET: RequestHandler = ({ locals }) =>
	json({ user: locals.user }, { headers: { 'cache-control': 'private, no-store' } });
