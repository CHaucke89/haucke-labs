<script lang="ts">
	import Seo from '#lib/components/Seo.svelte';
	import { tagSlug } from '#lib/blog.ts';
	import { formatDate } from '#lib/github.ts';
	import { AUTHOR, SITE_URL } from '#lib/site.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let post = $derived(data.post);
	let blogPosting = $derived({
		'@context': 'https://schema.org',
		'@type': 'BlogPosting',
		headline: post.title,
		description: post.description,
		datePublished: post.date,
		keywords: post.tags.join(', '),
		author: { '@type': 'Person', name: AUTHOR, url: SITE_URL }
	});
</script>

<Seo
	title={post.title}
	description={post.description}
	image={post.image}
	imageAlt={post.image ? `${post.title}: ${post.description}` : undefined}
	type="article"
	jsonLd={blogPosting}
/>

<article>
	<p class="back"><a href="/blog">← All posts</a></p>

	<header>
		<h1>{post.title}</h1>
		<p class="meta mono">
			<time datetime={post.date}>{formatDate(post.date)}</time> · {post.minutes} min read
		</p>
		{#if post.tags.length}
			<ul class="tags" role="list" aria-label="Tags">
				{#each post.tags as tag (tag)}
					<li><a class="mono" href="/blog/tags/{tagSlug(tag)}">{tag}</a></li>
				{/each}
			</ul>
		{/if}
	</header>

	<div class="prose">
		{@html post.html}
	</div>
</article>

<style>
	article {
		max-width: 46rem;
		padding-block: 1rem 2rem;
	}
	.back a {
		color: var(--muted);
		text-decoration: none;
	}
	.back a:hover {
		color: var(--text);
	}
	h1 {
		font-size: clamp(2rem, 5vw, 2.75rem);
		margin: 1.5rem 0 0.5rem;
	}
	.meta {
		margin: 0;
		font-size: 0.9rem;
		color: var(--muted);
	}
	.tags {
		list-style: none;
		padding: 0;
		margin: 1rem 0 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}
	.tags a {
		display: block;
		font-size: 0.75rem;
		padding: 0.15rem 0.55rem;
		border-radius: 999px;
		background: var(--accent-soft);
		text-decoration: none;
	}
	.tags a:hover {
		text-decoration: underline;
	}
	.prose {
		margin-top: 2.5rem;
	}
	.prose :global {
		h2 {
			margin-top: 2.5rem;
			font-size: 1.4rem;
		}
		h3 {
			margin-top: 2rem;
			font-size: 1.15rem;
		}
		li + li {
			margin-top: 0.35rem;
		}
		img {
			max-width: 100%;
			height: auto;
			border-radius: 8px;
		}
		blockquote {
			margin-inline: 0;
			padding: 0.1rem 1.25rem;
			border-left: 3px solid var(--accent);
			color: var(--muted);
		}
		hr {
			border: 0;
			border-top: 1px solid var(--border);
			margin-block: 2.5rem;
		}
		table {
			display: block;
			overflow-x: auto;
			border-collapse: collapse;
		}
		th,
		td {
			padding: 0.4rem 0.8rem;
			border: 1px solid var(--border);
			text-align: left;
		}
		:not(pre) > code {
			font-size: 0.875em;
			padding: 0.15em 0.4em;
			background: var(--surface);
			border: 1px solid var(--border);
			border-radius: 4px;
		}
		pre {
			padding: 1rem 1.25rem;
			overflow-x: auto;
			background: var(--surface);
			border: 1px solid var(--border);
			border-radius: 8px;
			font-size: 0.875rem;
			line-height: 1.55;
			tab-size: 2;
		}
		pre:focus-visible {
			outline: 2px solid var(--accent);
			outline-offset: 2px;
		}
		pre span {
			color: var(--shiki-dark);
		}
		@media (prefers-color-scheme: light) {
			pre span {
				color: var(--shiki-light);
			}
		}
	}
</style>
