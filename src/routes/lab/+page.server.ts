import { env } from 'cloudflare:workers';
import { KV_KEY, type Snapshot } from '#lib/lab.ts';
import type { PageServerLoad } from './$types';

// Live data, so this page is rendered per request instead of at build time.
export const prerender = false;

export const load: PageServerLoad = async ({ setHeaders, isDataRequest }) => {
	// The page refreshes itself by re-running this load in the background, which fetches
	// /lab/__data.json at the same URL every time. A max-age there would let the browser answer
	// those refreshes from its own cache for up to a minute, so they must always reach the Worker.
	// The first HTML load keeps a short cache; the refresh brings it up to date right after.
	setHeaders({ 'cache-control': isDataRequest ? 'no-store' : 'public, max-age=60' });
	const snapshot = await env.LAB.get<Snapshot>(KV_KEY, 'json');
	return { snapshot, now: Date.now() };
};
