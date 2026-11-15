<script lang="ts">
	import PostList from '#lib/components/PostList.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<Seo
	title="Blog"
	description="Tutorials and notes by Christopher Haucke on things learned while building his open source projects."
/>

<article>
	<h1>Blog</h1>
	<p class="lede">
		Tutorials and notes on things I’ve learned while working on my projects.
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
