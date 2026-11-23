import type { Plugin } from 'vite';
import { projects } from '../src/lib/projects.ts';

const ID = 'virtual:readmes';
const RESOLVED = `\0${ID}`;

function clean(markdown: string) {
	return markdown
		.replace(/<!--[\s\S]*?-->/g, '')
		.replace(/<img\b[^>]*>/gi, '')
		.replace(/!\[[^\]]*\]\([^)]*\)/g, '')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}

async function fetchReadme(repo: string) {
	const path = new URL(repo).pathname;
	const res = await fetch(`https://raw.githubusercontent.com${path}/HEAD/README.md`);
	if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
	return clean(await res.text());
}

/** Fetches each project's README once per build, so the chat's context is fixed between deploys. */
export function readmes(): Plugin {
	let cached: Promise<Record<string, string>> | undefined;

	const load = async () => {
		const entries = await Promise.all(
			projects.map(async (p) => {
				try {
					return [p.slug, await fetchReadme(p.repo)] as const;
				} catch (err) {
					console.warn(`[readmes] ${p.repo}: ${(err as Error).message}; leaving it out`);
					return [p.slug, ''] as const;
				}
			})
		);
		return Object.fromEntries(entries);
	};

	return {
		name: 'readmes',
		resolveId: (id) => (id === ID ? RESOLVED : undefined),
		async load(id) {
			if (id !== RESOLVED) return;
			cached ??= load();
			return `export default ${JSON.stringify(await cached)};`;
		}
	};
}
