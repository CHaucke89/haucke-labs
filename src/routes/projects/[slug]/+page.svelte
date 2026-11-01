<script lang="ts">
	import ArchitectureDiagram from '#lib/components/ArchitectureDiagram.svelte';
	import { diagrams } from '#lib/diagrams.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let project = $derived(data.project);
	let diagram = $derived(diagrams[project.slug]);
</script>

<svelte:head>
	<title>{project.name} · Haucke Labs</title>
	<meta name="description" content={project.tagline} />
</svelte:head>

<article>
	<p class="back"><a href="/">← All projects</a></p>

	<header>
		<h1>{project.name}</h1>
		<p class="tagline">{project.tagline}</p>
		<dl class="meta">
			<div>
				<dt>Role</dt>
				<dd>{project.role}</dd>
			</div>
			<div>
				<dt>Stack</dt>
				<dd>
					<ul class="tech">
						{#each project.tech as t (t)}
							<li class="mono">{t}</li>
						{/each}
					</ul>
				</dd>
			</div>
		</dl>
		<a class="button" href={project.repo}>View source on GitHub</a>
	</header>

	<section aria-labelledby="problem">
		<h2 id="problem">The problem</h2>
		{#each project.problem as para (para)}
			<p>{para}</p>
		{/each}
	</section>

	<section aria-labelledby="built">
		<h2 id="built">What I built</h2>
		{#each project.built as para (para)}
			<p>{para}</p>
		{/each}
	</section>

	{#if diagram}
		<section aria-labelledby="architecture" class="wide">
			<h2 id="architecture">How it fits together</h2>
			{#key project.slug}
				<ArchitectureDiagram {diagram} id="diagram-{project.slug}" />
			{/key}
		</section>
	{/if}

	<section aria-labelledby="challenges">
		<h2 id="challenges">The hard parts</h2>
		<div class="challenges">
			{#each project.challenges as c (c.title)}
				<div class="challenge">
					<h3>{c.title}</h3>
					<p>{c.body}</p>
				</div>
			{/each}
		</div>
	</section>

	<section aria-labelledby="learned">
		<h2 id="learned">What I learned</h2>
		<ul>
			{#each project.learned as item (item)}
				<li>{item}</li>
			{/each}
		</ul>
	</section>

	<nav class="next" aria-label="Next project">
		<span>Next project</span>
		<a href="/projects/{data.next.slug}">{data.next.name} →</a>
	</nav>
</article>

<style>
	article {
		max-width: 46rem;
		--wide: min(64rem, 100vw - 2.5rem);
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
	.tagline {
		font-size: 1.2rem;
		color: var(--accent);
		margin-top: 0;
	}
	.meta {
		display: grid;
		gap: 0.75rem;
		margin: 1.5rem 0;
	}
	.meta div {
		display: grid;
		grid-template-columns: 5rem 1fr;
		align-items: baseline;
	}
	dt {
		color: var(--muted);
		font-size: 0.875rem;
	}
	dd {
		margin: 0;
	}
	.tech {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}
	.tech li {
		font-size: 0.75rem;
		padding: 0.15rem 0.55rem;
		border-radius: 999px;
		background: var(--accent-soft);
		color: var(--accent);
	}
	.button {
		display: inline-block;
		padding: 0.55rem 1rem;
		border: 1px solid var(--border);
		border-radius: 8px;
		background: var(--surface);
		color: var(--text);
		text-decoration: none;
		font-weight: 600;
	}
	.button:hover {
		border-color: var(--accent);
	}
	section {
		margin-top: 3rem;
	}
	h2 {
		font-size: 1.4rem;
	}
	.wide {
		width: var(--wide);
	}
	.challenges {
		display: grid;
		gap: 1rem;
	}
	.challenge {
		padding: 1.25rem 1.5rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-left: 3px solid var(--accent);
		border-radius: 8px;
	}
	.challenge h3 {
		margin: 0 0 0.5rem;
		font-size: 1.05rem;
	}
	.challenge p {
		margin: 0;
		color: var(--muted);
	}
	.next {
		margin-top: 4rem;
		padding-top: 1.5rem;
		border-top: 1px solid var(--border);
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
	}
	.next span {
		color: var(--muted);
	}
	.next a {
		font-weight: 600;
	}
</style>
