<script lang="ts">
	import { page } from '$app/state';
	import Seo from '#lib/components/Seo.svelte';

	let notFound = $derived(page.status === 404);
</script>

<Seo
	title={notFound ? 'Page not found' : 'Something went wrong'}
	description="This page could not be shown."
	noindex
/>

<section class="error">
	<p class="code mono" aria-hidden="true">{page.status}</p>
	<h1>{notFound ? 'This page doesn’t exist' : 'Something went wrong'}</h1>
	<p class="lede">
		{#if notFound}
			The link may be out of date or mistyped. Everything on the site is one click away from
			here.
		{:else}
			{page.error?.message ?? 'An unexpected error occurred.'} Please try again in a moment.
		{/if}
	</p>
	<p class="links">
		<a href="/">See all projects</a>
		<a href="/about">About me</a>
	</p>
</section>

<style>
	.error {
		max-width: 40rem;
		padding-block: 3rem;
	}
	.code {
		margin: 0;
		font-size: clamp(3rem, 12vw, 5rem);
		font-weight: 700;
		line-height: 1;
		color: var(--accent);
	}
	h1 {
		font-size: clamp(1.75rem, 5vw, 2.5rem);
		margin: 1rem 0;
	}
	.lede {
		color: var(--muted);
		font-size: 1.1rem;
	}
	.links {
		display: flex;
		gap: 1.5rem;
		flex-wrap: wrap;
	}
</style>
