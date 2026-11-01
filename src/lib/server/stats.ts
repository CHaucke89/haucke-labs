import { fetchRepoStats, repoName, type RepoStats } from '#lib/github.ts';
import { getProject, projects } from '#lib/projects.ts';

// Prerendering renders every page in one process, so each repo is fetched once per build.
const cache = new Map<string, Promise<RepoStats | null>>();

export function getStats(fetchFn: typeof fetch, slug: string): Promise<RepoStats | null> {
	const project = getProject(slug);
	if (!project) return Promise.resolve(null);
	let pending = cache.get(slug);
	if (!pending) {
		pending = fetchRepoStats(repoName(project.repo), fetchFn);
		cache.set(slug, pending);
	}
	return pending;
}

export async function getAllStats(fetchFn: typeof fetch): Promise<Record<string, RepoStats | null>> {
	const entries = await Promise.all(
		projects.map(async (p) => [p.slug, await getStats(fetchFn, p.slug)] as const)
	);
	return Object.fromEntries(entries);
}
