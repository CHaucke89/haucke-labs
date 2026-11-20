<script lang="ts">
	let { current }: { current: 'svelte' | 'angular' } = $props();

	const versions = [
		{ id: 'svelte', label: 'Svelte', href: '/guestbook' },
		{ id: 'angular', label: 'Angular', href: '/guestbook/angular' }
	] as const;
</script>

<nav aria-label="Guestbook version">
	{#each versions as v (v.id)}
		<a href={v.href} aria-current={v.id === current ? 'page' : undefined}>{v.label}</a>
	{/each}
</nav>

<style>
	nav {
		display: inline-flex;
		padding: 0.2rem;
		margin-bottom: 1.5rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 999px;
	}
	a {
		padding: 0.3rem 0.9rem;
		color: var(--muted);
		text-decoration: none;
		border-radius: 999px;
		font-size: 0.9rem;
	}
	a:hover {
		color: var(--text);
	}
	a[aria-current='page'] {
		color: var(--accent);
		background: var(--accent-soft);
	}
</style>
