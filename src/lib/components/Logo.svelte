<script lang="ts">
	// The Haucke Labs hex-node mark. Colors come from the theme tokens, so it follows light/dark mode.
	let { size = '1.6em' }: { size?: string } = $props();
</script>

<svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" focusable="false">
	<path
		d="M32 5 55.4 18.5V45.5L32 59 8.6 45.5V18.5Z"
		fill="none"
		stroke="var(--text)"
		stroke-width="4"
		stroke-linejoin="round"
	/>
	<path
		d="M22 20V44M42 20V44M22 32H42"
		fill="none"
		stroke="var(--accent)"
		stroke-width="5"
		stroke-linecap="round"
	/>
	<circle cx="32" cy="32" r="5.5" fill="var(--accent)" stroke="var(--bg)" stroke-width="2.5" />
</svg>

<style>
	svg {
		display: block;
		flex: none;
	}
</style>
