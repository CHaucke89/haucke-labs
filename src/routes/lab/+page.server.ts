import { env } from 'cloudflare:workers';
import { KV_KEY, type Snapshot } from '#lib/lab.ts';
import { cameraConfig } from '#lib/server/camera.ts';
import type { PageServerLoad } from './$types';

// Live data, so this page is rendered per request instead of at build time.
export const prerender = false;

export const load: PageServerLoad = async ({ setHeaders, isDataRequest }) => {
	setHeaders({ 'cache-control': isDataRequest ? 'no-store' : 'public, max-age=60' });
	// Previews have no LAB binding; show "no data yet" instead of crashing.
	const snapshot = env.LAB ? await env.LAB.get<Snapshot>(KV_KEY, 'json') : null;
	// Only the fact that a camera exists reaches the page; its URL stays on the Worker.
	return { snapshot, now: Date.now(), camera: cameraConfig() !== null };
};
