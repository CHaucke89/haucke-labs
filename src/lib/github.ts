export type RepoStats = { stars: number; forks: number; pushedAt: string };

/** "CHaucke89/cloudypilot" from "https://github.com/CHaucke89/cloudypilot". */
export function repoName(url: string): string {
	return new URL(url).pathname.replace(/^\/+|\/+$/g, '');
}

/** Unauthenticated, so rate limits are likely; null on any failure so callers can hide the stats. */
export async function fetchRepoStats(
	name: string,
	fetchFn: typeof fetch = fetch,
	init: RequestInit = {}
): Promise<RepoStats | null> {
	try {
		const res = await fetchFn(`https://api.github.com/repos/${name}`, {
			signal: AbortSignal.timeout(8000),
			...init,
			// Accept is CORS-safelisted, so browsers skip the preflight request.
			headers: { Accept: 'application/vnd.github+json' }
		});
		if (!res.ok) return null;
		const json = (await res.json()) as {
			stargazers_count?: unknown;
			forks_count?: unknown;
			pushed_at?: unknown;
		};
		const { stargazers_count: stars, forks_count: forks, pushed_at: pushedAt } = json;
		if (typeof stars !== 'number' || typeof pushedAt !== 'string') return null;
		return { stars, forks: typeof forks === 'number' ? forks : 0, pushedAt };
	} catch {
		return null;
	}
}

// Fixed locale and time zone so the prerendered HTML and the browser agree.
const dateFormat = new Intl.DateTimeFormat('en-US', {
	month: 'short',
	day: 'numeric',
	year: 'numeric',
	timeZone: 'UTC'
});

export const formatDate = (iso: string) => dateFormat.format(new Date(iso));
