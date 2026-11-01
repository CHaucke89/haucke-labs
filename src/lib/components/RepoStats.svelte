<script lang="ts">
	import { onMount } from 'svelte';
	import { fetchRepoStats, formatDate, type RepoStats } from '#lib/github.ts';

	type Props = {
		/** Full repo name, e.g. "CHaucke89/cloudypilot". */
		repo: string;
		/** Snapshot taken when the site was built, shown until live numbers arrive. */
		initial?: RepoStats | null;
	};

	let { repo, initial = null }: Props = $props();

	let live = $state<RepoStats | null>(null);
	let stats = $derived(live ?? initial);

	const CACHE_MS = 10 * 60 * 1000;

	onMount(() => {
		const key = `gh-stats:${repo}`;
		try {
			const cached = JSON.parse(sessionStorage.getItem(key) ?? 'null');
			if (cached && Date.now() - cached.savedAt < CACHE_MS) {
				live = cached.stats;
				return;
			}
		} catch {
			// Storage can be unavailable (private mode, disabled cookies). Fetch instead.
		}

		let active = true;
		// Low priority: the snapshot is already on screen, so this must not compete with the page.
		fetchRepoStats(repo, fetch, { priority: 'low' }).then((fresh) => {
			if (!fresh || !active) return;
			live = fresh;
			try {
				sessionStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), stats: fresh }));
			} catch {
				// Ignore: caching is only an optimization.
			}
		});
		return () => {
			active = false;
		};
	});

	const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
</script>

<div class="slot">
	{#if stats}
		<ul class="stats" role="list" aria-label="GitHub activity">
			{#if stats.stars > 0}
				<li>
					<svg viewBox="0 0 16 16" aria-hidden="true"
						><path
							d="M8 1.2l2 4.3 4.6.6-3.4 3.2.9 4.6L8 11.6l-4.1 2.3.9-4.6L1.4 6.1 6 5.5z"
						/></svg
					>
					{plural(stats.stars, 'star')}
				</li>
			{/if}
			{#if stats.forks > 0}
				<li>
					<svg viewBox="0 0 16 16" aria-hidden="true" class="line"
						><circle cx="4" cy="3" r="1.6" /><circle cx="12" cy="3" r="1.6" /><circle
							cx="8"
							cy="13"
							r="1.6"
						/><path d="M4 4.6v1.2c0 1.3 1 2.2 2.2 2.2h3.6c1.2 0 2.2-.9 2.2-2.2V4.6M8 8v3.4" /></svg
					>
					{plural(stats.forks, 'fork')}
				</li>
			{/if}
			<li>
				<svg viewBox="0 0 16 16" aria-hidden="true" class="line"
					><circle cx="8" cy="8" r="6.2" /><path d="M8 4.5V8l2.4 1.6" /></svg
				>
				Updated <time datetime={stats.pushedAt}>{formatDate(stats.pushedAt)}</time>
			</li>
		</ul>
	{/if}
</div>

<style>
	.slot {
		min-block-size: 1.6em;
	}
	.stats {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem 1rem;
		font-size: 0.85rem;
		color: var(--muted);
	}
	.stats li {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
	}
	svg {
		width: 1em;
		height: 1em;
		flex: none;
		fill: currentColor;
	}
	svg.line {
		fill: none;
		stroke: currentColor;
		stroke-width: 1.4;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
</style>
