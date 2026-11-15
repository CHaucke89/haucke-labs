<script lang="ts">
	// `stamp` changes on every page refresh, so the image is re-requested and follows the job.
	let { stamp }: { stamp: number } = $props();

	let shown = $state(false);
	// Unset until mounted: an error during the server render would fire before hydration and be missed.
	let src = $state<string>();

	$effect(() => {
		src = `/lab/thumbnail?t=${stamp}`;
	});
</script>

<figure class="thumb" hidden={!shown}>
	<div class="frame">
		{#if src}
			<img
				{src}
				alt="Slicer preview of the model being printed"
				onload={() => (shown = true)}
				onerror={() => (shown = false)}
			/>
		{/if}
	</div>
	<figcaption class="mono">Now printing</figcaption>
</figure>

<style>
	.thumb {
		margin: 0;
		flex: 0 1 15rem;
		min-width: 10rem;
	}
	.frame {
		aspect-ratio: 1;
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
	figcaption {
		margin-top: 0.5rem;
		color: var(--muted);
		font-size: 0.9rem;
	}
</style>
