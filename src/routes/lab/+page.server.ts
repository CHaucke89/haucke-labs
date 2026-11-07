import { env } from 'cloudflare:workers';
import { KV_KEY, type Snapshot } from '#lib/lab.ts';
import type { PageServerLoad } from './$types';

// Live data, so this page is rendered per request instead of at build time.
export const prerender = false;

export const load: PageServerLoad = async ({ setHeaders }) => {
	// Short edge/browser cache: snapshots arrive every few minutes at most.
	setHeaders({ 'cache-control': 'public, max-age=60' });
	const snapshot = await env.LAB.get<Snapshot>(KV_KEY, 'json');
	return { snapshot, now: Date.now() };
};
