<script lang="ts">
	import PostList from '#lib/components/PostList.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<Seo title="Posts tagged {data.tag}" description="Blog posts by Christopher Haucke tagged {data.tag}." />

<article>
	<p class="back"><a href="/blog">← All posts</a></p>
	<h1>Posts tagged <span class="accent">{data.tag}</span></h1>
	<PostList posts={data.posts} />
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
	.accent {
		color: var(--accent);
	}
</style>
