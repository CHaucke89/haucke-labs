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
