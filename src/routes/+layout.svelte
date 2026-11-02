<script lang="ts">
	import '../app.css';
	import favicon from '#lib/assets/favicon.svg';
	import Logo from '#lib/components/Logo.svelte';
	import { page } from '$app/state';
	import { AUTHOR, GITHUB_URL, LINKEDIN_URL, SOURCE_URL } from '#lib/site.ts';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	const nav = [
		{ href: '/', label: 'Projects' },
		{ href: '/about', label: 'About' }
	];

	// Project pages count as part of "Projects".
	const isCurrent = (href: string, path: string) =>
		href === '/' ? path === '/' || path.startsWith('/projects/') : path === href;
</script>

<svelte:head>
	<link rel="icon" href={favicon} type="image/svg+xml" />
</svelte:head>

<a class="skip" href="#main">Skip to content</a>

<header class="container">
	<a class="brand mono" href="/"><Logo /><span>haucke<span class="accent">labs</span></span></a>
	<nav aria-label="Main">
		{#each nav as item (item.href)}
			<a
				href={item.href}
				aria-current={isCurrent(item.href, page.url.pathname) ? 'page' : undefined}>{item.label}</a
			>
		{/each}
		<a href={GITHUB_URL}>GitHub</a>
		<a href={LINKEDIN_URL}>LinkedIn</a>
	</nav>
</header>

<main id="main" class="container">
	{@render children()}
</main>

<footer class="container">
	<p>
		© {new Date().getFullYear()}
		{AUTHOR} · Built with SvelteKit, hosted on Cloudflare ·
		<a href={SOURCE_URL}>Source for this site</a>
	</p>
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
		display: inline-flex;
		align-items: center;
		gap: 0.55rem;
		font-weight: 700;
		font-size: 1.1rem;
		color: var(--text);
		text-decoration: none;
	}
	.brand .accent {
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
