<script lang="ts">
	// The Haucke Labs HL mark: an H and an L sharing a stem. Colors come from the theme tokens,
	// so it follows light/dark mode, and the orange L matches "labs" in the wordmark.
	let { size = '1.6em' }: { size?: string } = $props();
</script>

<svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" focusable="false">
	<path d="M14 12V52M14 32H34" fill="none" stroke="var(--text)" stroke-width="6.5" stroke-linecap="round" />
	<path
		d="M34 12V52H52"
		fill="none"
		stroke="var(--accent)"
		stroke-width="6.5"
		stroke-linecap="round"
		stroke-linejoin="round"
	/>
</svg>

<style>
	svg {
		display: block;
		flex: none;
	}
</style>
