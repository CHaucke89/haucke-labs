import { env } from 'cloudflare:workers';
import { KV_KEY, type Snapshot } from '#lib/lab.ts';
import type { PageServerLoad } from './$types';

// Live data, so this page is rendered per request instead of at build time.
export const prerender = false;

export const load: PageServerLoad = async ({ setHeaders, isDataRequest }) => {
	setHeaders({ 'cache-control': isDataRequest ? 'no-store' : 'public, max-age=60' });
	// Preview deployments have no LAB binding, so treat a
	// missing namespace as "no data yet" instead of crashing the page.
	const snapshot = env.LAB ? await env.LAB.get<Snapshot>(KV_KEY, 'json') : null;
	return { snapshot, now: Date.now() };
};
