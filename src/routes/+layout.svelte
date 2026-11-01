<script lang="ts">
	import '../app.css';
	import favicon from '#lib/assets/favicon.svg';
	import { page } from '$app/state';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	const nav = [
		{ href: '/', label: 'Projects' },
		{ href: '/about', label: 'About' }
	];
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<a class="skip" href="#main">Skip to content</a>

<header class="container">
	<a class="brand mono" href="/">haucke<span>labs</span></a>
	<nav aria-label="Main">
		{#each nav as item (item.href)}
			<a href={item.href} aria-current={page.url.pathname === item.href ? 'page' : undefined}
				>{item.label}</a
			>
		{/each}
		<a href="https://github.com/CHaucke89">GitHub</a>
	</nav>
</header>

<main id="main" class="container">
	{@render children()}
</main>

<footer class="container">
	<p>© {new Date().getFullYear()} Christopher Haucke · Built with SvelteKit, hosted on Cloudflare</p>
</footer>

<style>
	.skip {
		position: absolute;
		left: 1rem;
		top: -3rem;
		padding: 0.5rem 1rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 6px;
	}
	.skip:focus {
		top: 1rem;
	}
	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
		padding-block: 1.5rem;
	}
	.brand {
		font-weight: 700;
		font-size: 1.1rem;
		color: var(--text);
		text-decoration: none;
	}
	.brand span {
		color: var(--accent);
	}
	nav {
		display: flex;
		gap: 1.25rem;
	}
	nav a {
		color: var(--muted);
		text-decoration: none;
	}
	nav a:hover,
	nav a[aria-current='page'] {
		color: var(--text);
	}
	main {
		min-height: 70vh;
	}
	footer {
		margin-top: 5rem;
		padding-block: 2rem;
		border-top: 1px solid var(--border);
		color: var(--muted);
		font-size: 0.875rem;
	}
</style>
