<script lang="ts">
	let { src, name, size }: { src: string | null; name: string; size: number } = $props();
</script>

{#if src}
	<!-- no-referrer: Google's avatar host sometimes rejects hotlinked requests that send one. -->
	<img {src} alt="" width={size} height={size} loading="lazy" referrerpolicy="no-referrer" />
{:else}
	<span aria-hidden="true" style:width="{size}px" style:height="{size}px" style:font-size="{size / 2}px"
		>{name.charAt(0).toUpperCase()}</span
	>
{/if}

<style>
	img,
	span {
		border-radius: 50%;
		flex-shrink: 0;
	}
	span {
		display: inline-grid;
		place-items: center;
		color: var(--bg);
		background: var(--accent);
		font-weight: 600;
	}
</style>
