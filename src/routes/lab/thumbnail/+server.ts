import { error } from '@sveltejs/kit';
import { cameraConfig, printerFetch, type CameraConfig } from '#lib/server/camera.ts';
import type { RequestHandler } from './$types';

export const prerender = false;

type PrintStats = { result?: { status?: { print_stats?: { filename?: string; state?: string } } } };
type Metadata = { result?: { thumbnails?: { width: number; relative_path: string }[] } };

async function moonraker<T>(camera: CameraConfig, path: string): Promise<T | null> {
	const res = await printerFetch(camera, new URL(path, camera.url));
	// The camera answers any path the tunnel doesn't route to Moonraker, so insist on JSON.
	if (!res?.ok || !res.headers.get('content-type')?.startsWith('application/json')) return null;
	return res.json<T>().catch(() => null);
}

const encodePath = (path: string) => path.split('/').map(encodeURIComponent).join('/');

/** `GET /lab/thumbnail` returns the slicer preview of the job being printed, or 404 without one. */
export const GET: RequestHandler = async () => {
	const camera = cameraConfig();
	if (!camera) error(404, 'Printer is not configured');

	const stats = await moonraker<PrintStats>(camera, '/printer/objects/query?print_stats=filename,state');
	const job = stats?.result?.status?.print_stats;
	if (!job?.filename || (job.state !== 'printing' && job.state !== 'paused')) {
		error(404, 'Nothing is printing');
	}

	const meta = await moonraker<Metadata>(
		camera,
		`/server/files/metadata?filename=${encodeURIComponent(job.filename)}`
	);
	const thumbnails = meta?.result?.thumbnails ?? [];
	const largest = thumbnails.reduce<(typeof thumbnails)[number] | undefined>(
		(a, b) => (a && a.width >= b.width ? a : b),
		undefined
	);
	if (!largest?.relative_path) error(404, 'This job has no thumbnail');

	// relative_path is relative to the gcode file's own folder.
	const dir = job.filename.includes('/') ? job.filename.slice(0, job.filename.lastIndexOf('/') + 1) : '';
	const res = await printerFetch(
		camera,
		new URL(`/server/files/gcodes/${encodePath(dir + largest.relative_path)}`, camera.url)
	);
	const type = res?.headers.get('content-type') ?? '';
	if (!res?.ok || !type.startsWith('image/')) error(502, 'Thumbnail is unavailable');

	return new Response(res.body, {
		headers: {
			'content-type': type,
			'cache-control': 'no-store',
			'x-content-type-options': 'nosniff'
		}
	});
};
