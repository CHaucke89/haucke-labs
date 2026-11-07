import { env } from 'cloudflare:workers';
import { error, json } from '@sveltejs/kit';
import { KV_KEY, parseReadings, type Snapshot } from '#lib/lab.ts';
import type { RequestHandler } from './$types';

// Runs on the Worker per request; the rest of the site is prerendered.
export const prerender = false;

const MAX_BODY_BYTES = 16 * 1024;

/** Constant-time comparison so the token can't be guessed byte by byte from response timing. */
function tokenMatches(given: string, expected: string): boolean {
	const enc = new TextEncoder();
	const a = enc.encode(given);
	const b = enc.encode(expected);
	// XOR every byte of the expected token, without stopping at the first mismatch; a length
	// mismatch is folded into the result instead of returning early.
	let diff = a.byteLength ^ b.byteLength;
	for (let i = 0; i < b.byteLength; i++) diff |= (a[i] ?? 0) ^ b[i];
	return diff === 0;
}

export const POST: RequestHandler = async ({ request }) => {
	const expected = env.LAB_INGEST_TOKEN;
	if (!expected) error(503, 'Lab ingest is not configured');

	const auth = request.headers.get('authorization') ?? '';
	const given = auth.startsWith('Bearer ') ? auth.slice(7) : '';
	if (!tokenMatches(given, expected)) error(401, 'Unauthorized');

	const raw = await request.text();
	if (raw.length > MAX_BODY_BYTES) error(413, 'Payload too large');

	let body: unknown;
	try {
		body = JSON.parse(raw);
	} catch {
		error(400, 'Body must be JSON');
	}

	const readings = parseReadings(body);
	if (!readings) error(422, 'Expected { readings: [{ id, label, value, unit?, group? }] }');

	const snapshot: Snapshot = { readings, receivedAt: new Date().toISOString() };
	await env.LAB.put(KV_KEY, JSON.stringify(snapshot));
	return json({ ok: true, stored: readings.length });
};
