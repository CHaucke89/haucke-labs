<script lang="ts">
	import { page } from '$app/state';
	import { SITE_NAME, SITE_URL } from '#lib/site.ts';

	type Props = {
		/** Page-specific title. The site name is appended for the browser tab. */
		title: string;
		description: string;
		/** Preview image path under static/, 1200×630. */
		image?: string;
		imageAlt?: string;
		type?: 'website' | 'profile' | 'article';
		noindex?: boolean;
		jsonLd?: Record<string, unknown>;
	};

	let {
		title,
		description,
		image = '/og/home.png',
		imageAlt = 'Haucke Labs: open source projects by Christopher Haucke',
		type = 'website',
		noindex = false,
		jsonLd
	}: Props = $props();

	let url = $derived(new URL(page.url.pathname, SITE_URL).href);
	let imageUrl = $derived(new URL(image, SITE_URL).href);
	// Escape "<" so the JSON can never close the script element early. The closing tag is
	// split because a literal one would end this component's own script block.
	let jsonLdTag = $derived(
		jsonLd
			? `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}<` +
					'/script>'
			: ''
	);
</script>

<svelte:head>
	<title>{title} · {SITE_NAME}</title>
	<meta name="description" content={description} />
	{#if noindex}
		<meta name="robots" content="noindex" />
	{:else}
		<link rel="canonical" href={url} />
	{/if}
	<meta property="og:type" content={type} />
	<meta property="og:site_name" content={SITE_NAME} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={url} />
	<meta property="og:image" content={imageUrl} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content={imageAlt} />
	<meta name="twitter:card" content="summary_large_image" />
	{@html jsonLdTag}
</svelte:head>
