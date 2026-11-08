import { error } from '@sveltejs/kit';
import { cameraConfig } from '#lib/server/camera.ts';
import type { RequestHandler } from './$types';

// Proxies the printer camera so visitors never see its hostname or need an Access login.
export const prerender = false;

/** `GET /lab/camera` returns one JPEG; `GET /lab/camera?live` streams MJPEG. */
export const GET: RequestHandler = async ({ url }) => {
	const camera = cameraConfig();
	if (!camera) error(404, 'Camera is not configured');

	const live = url.searchParams.has('live');
	const upstream = new URL(camera.url);
	upstream.searchParams.set('action', live ? 'stream' : 'snapshot');

	const res = await fetch(upstream, {
		// Cloudflare Access service token: lets this Worker past Access without a browser login.
		headers: {
			'CF-Access-Client-Id': camera.clientId,
			'CF-Access-Client-Secret': camera.clientSecret
		},
		// A rejected token gets a redirect to the Access login page; treat it as a failure.
		redirect: 'manual'
	}).catch(() => null);

	// Network error, tunnel down (Cloudflare answers 502/530), or Access refused the token.
	if (!res?.ok) error(502, 'Camera is offline');

	// Only pass through what a camera should send, never an HTML error page.
	const type = res.headers.get('content-type') ?? '';
	if (!type.startsWith(live ? 'multipart/x-mixed-replace' : 'image/')) {
		error(502, 'Unexpected camera response');
	}

	// Hand the upstream body straight back. For the live stream this pipes bytes without the
	// Worker touching them, and closing the tab cancels the request and its upstream fetch.
	return new Response(res.body, {
		headers: {
			'content-type': type,
			'cache-control': 'no-store',
			'x-content-type-options': 'nosniff'
		}
	});
};
