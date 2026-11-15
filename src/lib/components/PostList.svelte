<script lang="ts">
	import { tagSlug, type PostMeta } from '#lib/blog.ts';
	import { formatDate } from '#lib/github.ts';

	let { posts }: { posts: PostMeta[] } = $props();
</script>

<ul class="list" role="list">
	{#each posts as post (post.slug)}
		<li>
			<h2><a class="title" href="/blog/{post.slug}">{post.title}</a></h2>
			<p class="meta mono">
				<time datetime={post.date}>{formatDate(post.date)}</time> · {post.minutes} min read
			</p>
			<p>{post.description}</p>
			{#if post.tags.length}
				<ul class="tags" role="list" aria-label="Tags">
					{#each post.tags as tag (tag)}
						<li><a class="mono" href="/blog/tags/{tagSlug(tag)}">{tag}</a></li>
					{/each}
				</ul>
			{/if}
		</li>
	{/each}
</ul>

<style>
	.list {
		list-style: none;
		padding: 0;
		margin: 2rem 0 0;
		display: grid;
		gap: 1rem;
	}
	.list > li {
		padding: 1.25rem 1.5rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-left: 3px solid var(--accent);
		border-radius: 8px;
	}
	h2 {
		margin: 0;
		font-size: 1.25rem;
	}
	.title {
		color: var(--text);
		text-decoration: none;
	}
	.title:hover {
		color: var(--accent);
	}
	.meta {
		margin: 0.35rem 0 0;
		font-size: 0.85rem;
		color: var(--muted);
	}
	.list > li > p:not(.meta) {
		margin: 0.75rem 0 0;
		color: var(--muted);
	}
	.tags {
		list-style: none;
		padding: 0;
		margin: 0.9rem 0 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}
	.tags a {
		display: block;
		font-size: 0.75rem;
		padding: 0.15rem 0.55rem;
		border-radius: 999px;
		background: linear-gradient(var(--accent-soft), var(--accent-soft)), var(--bg);
		text-decoration: none;
	}
	.tags a:hover {
		text-decoration: underline;
	}
</style>
