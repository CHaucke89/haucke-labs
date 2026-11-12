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

export type Contribution = {
	title: string;
	url: string;
	repo: string;
	number: number;
	status: 'merged' | 'open';
	/** Merge date for merged PRs, open date otherwise. */
	date: string;
};

type SearchItem = {
	title?: unknown;
	html_url?: unknown;
	repository_url?: unknown;
	number?: unknown;
	state?: unknown;
	created_at?: unknown;
	pull_request?: { merged_at?: unknown };
};

// Pull requests in repos the user doesn't own, so the site's own projects are left out.
const contributionsQuery = (user: string) => `is:pr author:${user} -user:${user} -is:draft`;

/** Merged and open PRs, newest first; closed-unmerged ones are dropped. Null on any failure. */
export async function fetchContributions(
	user: string,
	fetchFn: typeof fetch = fetch,
	init: RequestInit = {}
): Promise<Contribution[] | null> {
	const endpoint = new URL('https://api.github.com/search/issues');
	endpoint.searchParams.set('q', contributionsQuery(user));
	endpoint.searchParams.set('per_page', '100');
	try {
		const res = await fetchFn(endpoint, {
			signal: AbortSignal.timeout(8000),
			...init,
			headers: { Accept: 'application/vnd.github+json' }
		});
		if (!res.ok) return null;
		const json = (await res.json()) as { items?: unknown };
		if (!Array.isArray(json.items)) return null;
		const out: Contribution[] = [];
		for (const item of json.items as SearchItem[]) {
			const mergedAt = item.pull_request?.merged_at;
			const status = typeof mergedAt === 'string' ? 'merged' : item.state === 'open' ? 'open' : null;
			const date = status === 'merged' ? mergedAt : item.created_at;
			const { title, html_url: url, repository_url: repoUrl, number } = item;
			if (!status || typeof date !== 'string' || typeof title !== 'string') continue;
			if (typeof url !== 'string' || typeof repoUrl !== 'string' || typeof number !== 'number') continue;
			out.push({ title, url, repo: repoName(repoUrl).replace(/^repos\//, ''), number, status, date });
		}
		return out.sort((a, b) => b.date.localeCompare(a.date));
	} catch {
		return null;
	}
}
