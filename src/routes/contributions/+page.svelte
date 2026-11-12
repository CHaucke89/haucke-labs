<script lang="ts">
	import { onMount } from 'svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { fetchContributions, formatDate, type Contribution } from '#lib/github.ts';
	import { GITHUB_USER } from '#lib/site.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let live = $state<Contribution[] | null>(null);
	let all = $derived(live ?? data.contributions);
	let merged = $derived(all?.filter((c) => c.status === 'merged') ?? []);
	let open = $derived(all?.filter((c) => c.status === 'open') ?? []);

	const CACHE_MS = 10 * 60 * 1000;
	const CACHE_KEY = 'gh-contributions';
	const searchUrl = `https://github.com/pulls?q=${encodeURIComponent(`is:pr author:${GITHUB_USER} -user:${GITHUB_USER}`)}`;

	// Same pattern as RepoStats: show the build-time snapshot, then refresh it quietly.
	onMount(() => {
		try {
			const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) ?? 'null');
			if (cached && Date.now() - cached.savedAt < CACHE_MS) {
				live = cached.contributions;
				return;
			}
		} catch {
			// Storage can be unavailable (private mode, disabled cookies). Fetch instead.
		}

		let active = true;
		fetchContributions(GITHUB_USER, fetch, { priority: 'low' }).then((fresh) => {
			if (!fresh || !active) return;
			live = fresh;
			try {
				sessionStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), contributions: fresh }));
			} catch {
				// Ignore: caching is only an optimization.
			}
		});
		return () => {
			active = false;
		};
	});
</script>

<Seo
	title="Contributions"
	description="Pull requests Christopher Haucke has opened in other open source projects, merged and in review."
/>

<article>
	<h1>Contributions</h1>
	<p class="lede">
		Pull requests I’ve opened in other people’s projects, mostly the openpilot forks I run in my car.
		The list comes straight from GitHub, so it stays current.
	</p>

	{#if all}
		{#each [{ id: 'merged', label: 'Merged', items: merged }, { id: 'open', label: 'In review', items: open }] as group (group.id)}
			{#if group.items.length}
				<section aria-labelledby="{group.id}-heading">
					<h2 id="{group.id}-heading">{group.label} <span class="count">{group.items.length}</span></h2>
					<ul class="list" role="list">
						{#each group.items as pr (pr.url)}
							<li>
								<a class="title" href={pr.url}>{pr.title}</a>
								<p class="meta mono">
									{pr.repo}#{pr.number} ·
									{pr.status === 'merged' ? 'Merged' : 'Opened'}
									<time datetime={pr.date}>{formatDate(pr.date)}</time>
								</p>
							</li>
						{/each}
					</ul>
				</section>
			{/if}
		{/each}
	{:else}
		<p>GitHub didn’t respond just now. <a href={searchUrl}>See the list on GitHub</a> instead.</p>
	{/if}
</article>

<style>
	article {
		max-width: 46rem;
		padding-block: 2rem;
	}
	h1 {
		font-size: clamp(2rem, 5vw, 2.75rem);
	}
	.lede {
		font-size: 1.15rem;
		color: var(--muted);
	}
	h2 {
		margin-top: 2.5rem;
		font-size: 1.35rem;
	}
	.count {
		font-size: 0.95rem;
		font-weight: 500;
		color: var(--muted);
	}
	.list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		gap: 0.75rem;
	}
	.list li {
		padding: 1rem 1.25rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-left: 3px solid var(--accent);
		border-radius: 8px;
	}
	.title {
		font-weight: 600;
	}
	.meta {
		margin: 0.35rem 0 0;
		font-size: 0.85rem;
		color: var(--muted);
	}
</style>
