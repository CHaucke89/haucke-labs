<script lang="ts">
	import { refreshAll } from '$app/navigation';
	import Seo from '#lib/components/Seo.svelte';
	import { freshness, type Reading } from '#lib/lab.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let snapshot = $derived(data.snapshot);
	let status = $derived(snapshot ? freshness(snapshot.receivedAt, data.now) : 'offline');

	// Keep Home Assistant's order, grouping readings under their section headings.
	let groups = $derived.by(() => {
		const map = new Map<string, Reading[]>();
		for (const r of snapshot?.readings ?? []) {
			const key = r.group ?? 'Other';
			map.set(key, [...(map.get(key) ?? []), r]);
		}
		return [...map];
	});

	const statusText = { live: 'Live', stale: 'Delayed', offline: 'Offline' } as const;

	// Relative to the server's render time, so server and client output match.
	const ago = (iso: string, now: number) => {
		const mins = Math.max(0, Math.round((now - Date.parse(iso)) / 60_000));
		if (mins < 1) return 'just now';
		if (mins < 60) return `${mins} min ago`;
		const hours = Math.round(mins / 60);
		return hours < 48 ? `${hours} h ago` : `${Math.round(hours / 24)} days ago`;
	};

	// Re-run this page's load on a timer so new readings appear without a reload. Home Assistant
	// pushes every 5 minutes, so 30 seconds keeps the "updated … ago" label honest without
	// hammering the Worker.
	const REFRESH_MS = 30_000;

	$effect(() => {
		let timer: ReturnType<typeof setInterval> | undefined;
		let inFlight = false;

		const refresh = async () => {
			// Skip when a refresh is still running or the device is offline: a failed data request
			// would replace the page with the error page.
			if (inFlight || !navigator.onLine) return;
			inFlight = true;
			try {
				await refreshAll();
			} finally {
				inFlight = false;
			}
		};

		const start = () => {
			clearInterval(timer);
			timer = setInterval(refresh, REFRESH_MS);
		};
		const stop = () => clearInterval(timer);

		// Pause while the tab is hidden; catch up at once when it comes back.
		const onVisibility = () => {
			if (document.hidden) {
				stop();
			} else {
				void refresh();
				start();
			}
		};

		if (!document.hidden) start();
		document.addEventListener('visibilitychange', onVisibility);
		window.addEventListener('online', refresh);

		// Runs when the visitor leaves /lab, so no timer or listener outlives the page.
		return () => {
			stop();
			document.removeEventListener('visibilitychange', onVisibility);
			window.removeEventListener('online', refresh);
		};
	});

	const fmt = (v: number | string) =>
		typeof v === 'number' ? v.toLocaleString('en-US', { maximumFractionDigits: 1 }) : v;
</script>

<Seo
	title="Lab"
	description="Live status from the Haucke Labs homelab: sensors, ESP32 devices and the 3D printer, pushed by Home Assistant."
/>

<section>
	<header>
		<h1>The lab, live</h1>
		<p class="lede">
			Sensors and devices around my house, reported by Home Assistant to a Cloudflare Worker and
			stored in KV.
		</p>
		<p class="status mono" data-status={status}>
			<span class="dot" aria-hidden="true"></span>
			{statusText[status]}
			{#if snapshot}
				· updated
				<time datetime={snapshot.receivedAt}>{ago(snapshot.receivedAt, data.now)}</time>
			{/if}
		</p>
	</header>

	{#if groups.length === 0}
		<p class="empty">No data yet. The lab hasn’t reported in.</p>
	{:else}
		{#each groups as [name, readings] (name)}
			<h2>{name}</h2>
			<ul class="grid">
				{#each readings as r (r.id)}
					<li class="card">
						<span class="label">{r.label}</span>
						<span class="value mono">{fmt(r.value)}{#if r.unit}<small>{r.unit}</small>{/if}</span>
					</li>
				{/each}
			</ul>
		{/each}
	{/if}
</section>

<style>
	section {
		padding-block: 2rem;
	}
	h1 {
		font-size: clamp(2rem, 5vw, 2.75rem);
	}
	.lede {
		font-size: 1.2rem;
		max-width: 42rem;
	}
	.status {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--muted);
		font-size: 0.9rem;
	}
	.dot {
		width: 0.6rem;
		height: 0.6rem;
		border-radius: 50%;
		background: var(--muted);
	}
	[data-status='live'] .dot {
		background: #3fb950;
		box-shadow: 0 0 0 3px rgb(63 185 80 / 0.25);
	}
	[data-status='stale'] .dot {
		background: var(--accent);
	}
	h2 {
		margin-top: 2rem;
		font-size: 1.1rem;
		color: var(--muted);
	}
	.grid {
		list-style: none;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
		gap: 0.75rem;
	}
	.card {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		padding: 1rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 0.5rem;
	}
	.label {
		color: var(--muted);
		font-size: 0.9rem;
	}
	.value {
		font-size: 1.5rem;
	}
	.value small {
		margin-left: 0.2rem;
		font-size: 0.9rem;
		color: var(--muted);
	}
	.empty {
		color: var(--muted);
	}
</style>
