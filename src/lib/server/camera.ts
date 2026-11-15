import { env } from 'cloudflare:workers';

export interface CameraConfig {
	url: string;
	clientId: string;
	clientSecret: string;
}

/** The printer camera's settings, or null until all three secrets are set (always in previews). */
export function cameraConfig(): CameraConfig | null {
	const url = env.CAMERA_URL;
	const clientId = env.CAMERA_ACCESS_CLIENT_ID;
	const clientSecret = env.CAMERA_ACCESS_CLIENT_SECRET;
	return url && clientId && clientSecret ? { url, clientId, clientSecret } : null;
}

/** Fetches from the printer's tunnel hostname; null on a network error. */
export function printerFetch(camera: CameraConfig, url: URL): Promise<Response | null> {
	return fetch(url, {
		// Cloudflare Access service token: lets this Worker past Access without a browser login.
		headers: {
			'CF-Access-Client-Id': camera.clientId,
			'CF-Access-Client-Secret': camera.clientSecret
		},
		// A rejected token gets a redirect to the Access login page; treat it as a failure.
		redirect: 'manual'
	}).catch(() => null);
}
