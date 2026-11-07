<script lang="ts">
	// Printer camera on /lab: a snapshot every few seconds by default, with an opt-in live stream
	// that times out so an idle tab can't hold a stream open on the home connection.
	const SNAPSHOT_MS = 5_000;
	const LIVE_MS = 2 * 60_000;

	let live = $state(false);
	let status = $state<'loading' | 'ok' | 'offline'>('loading');
	// 0 until mounted, so the server render never requests a frame. Changing it busts the cache.
	let tick = $state(0);

	let src = $derived(tick ? `/lab/camera?${live ? 'live&' : ''}t=${tick}` : undefined);

	$effect(() => {
		// Re-runs whenever `live` changes, restarting the matching timer.
		const isLive = live;
		let timer: ReturnType<typeof setInterval> | undefined;

		const start = () => {
			clearInterval(timer);
			tick = Date.now();
			timer = isLive
				? setTimeout(() => (live = false), LIVE_MS)
				: setInterval(() => (tick = Date.now()), SNAPSHOT_MS);
		};
		const stop = () => clearInterval(timer);

		// Hidden tab: stop polling and drop back from live, which closes the stream.
		const onVisibility = () => {
			if (!document.hidden) return start();
			stop();
			live = false;
		};

		if (!document.hidden) start();
		document.addEventListener('visibilitychange', onVisibility);
		return () => {
			stop();
			document.removeEventListener('visibilitychange', onVisibility);
		};
	});

	// Keeps the last frame on screen while switching; browsers differ on firing `load` for MJPEG.
	const toggle = () => (live = !live);
</script>

<figure class="cam" data-status={status}>
	<div class="frame">
		{#if src}
			<img
				{src}
				alt="Camera view of the 3D printer"
				onload={() => (status = 'ok')}
				onerror={() => {
					// A dropped stream falls back to snapshots, which keep retrying.
					status = 'offline';
					live = false;
				}}
			/>
		{/if}
		{#if status !== 'ok'}
			<p class="overlay mono" role="status">
				{status === 'loading' ? 'Connecting to the printer…' : 'Camera offline'}
			</p>
		{/if}
	</div>
	<figcaption>
		<span class="mono">{live ? 'Live · stops after 2 min' : 'Snapshot every 5 s'}</span>
		<button type="button" aria-pressed={live} onclick={toggle} disabled={status === 'offline'}>
			{live ? 'Back to snapshots' : 'Watch live'}
		</button>
	</figcaption>
</figure>

<style>
	.cam {
		margin: 2rem 0 0;
		max-width: 40rem;
	}
	.frame {
		position: relative;
		aspect-ratio: 4 / 3;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		overflow: hidden;
	}
	img {
		width: 100%;
		height: 100%;
		object-fit: contain;
		display: block;
	}
	[data-status='offline'] img {
		visibility: hidden;
	}
	.overlay {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		margin: 0;
		color: var(--muted);
	}
	figcaption {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		margin-top: 0.5rem;
		color: var(--muted);
		font-size: 0.9rem;
	}
	button {
		font: inherit;
		padding: 0.35rem 0.8rem;
		color: var(--text);
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 0.4rem;
		cursor: pointer;
	}
	button:hover:not(:disabled) {
		border-color: var(--accent);
	}
	button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
