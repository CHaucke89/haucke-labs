import { getAllStats } from '#lib/server/stats.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => ({ stats: await getAllStats(fetch) });
