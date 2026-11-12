import { fetchContributions } from '#lib/github.ts';
import { GITHUB_USER } from '#lib/site.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => ({
	contributions: await fetchContributions(GITHUB_USER, fetch)
});
