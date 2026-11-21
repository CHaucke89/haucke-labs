<script lang="ts">
	import PostList from '#lib/components/PostList.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<Seo
	title="Blog"
	description="Christopher Haucke's Blog"
/>

<article>
	<h1>Blog</h1>
	<p class="lede">
		Notes, observations, anything.
		<a href="/blog/rss.xml">Subscribe with RSS</a>.
	</p>

	{#if data.posts.length}
		<PostList posts={data.posts} />
	{:else}
		<p>Nothing here yet.</p>
	{/if}
</article>

<style>
	article {
		max-width: 46rem;
		padding-block: 2rem;
	}
	h1 {
		font-size: clamp(2rem, 5vw, 2.75rem);
	}
	.lede {
		font-size: 1.15rem;
		color: var(--muted);
	}
</style>
