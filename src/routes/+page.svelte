<script lang="ts">
	import DiagramThumb from '#lib/components/DiagramThumb.svelte';
	import RepoStats from '#lib/components/RepoStats.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { diagrams } from '#lib/diagrams.ts';
	import { repoName } from '#lib/github.ts';
	import { projects } from '#lib/projects.ts';
	import { reveal } from '#lib/reveal.ts';
	import { AUTHOR, GITHUB_URL, LINKEDIN_URL, SITE_URL } from '#lib/site.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const person = {
		'@context': 'https://schema.org',
		'@type': 'Person',
		name: AUTHOR,
		url: SITE_URL,
		sameAs: [GITHUB_URL, LINKEDIN_URL]
	};
</script>

<Seo
	title={AUTHOR}
	description="Open source projects by Christopher Haucke: driver-assistance software, real-time UI streaming and Windows deployment tooling."
	jsonLd={person}
/>

<section class="hero">
	<div class="backdrop" aria-hidden="true"></div>
	<p class="eyebrow mono">Christopher Haucke</p>
	<h1>I build tools that solve the problems in front of me.</h1>
	<p class="lede">
		From driver-assistance software running in my car, to a browser-based remote display for it, to
		the Windows tooling I use at work. Here are the open source projects I’ve built, what was hard
		about them, and how they fit together.
	</p>
	<p class="buttons">
		<a class="button primary" href="/about">More about me</a>
		<a class="button" href={GITHUB_URL}>GitHub profile</a>
	</p>
</section>

<section aria-labelledby="projects-heading">
	<h2 id="projects-heading">Projects</h2>
	<ul class="grid" role="list">
		{#each projects as project, i (project.slug)}
			<li {@attach reveal((i % 2) * 120)}>
				<article class="card">
					<a class="preview" href="/projects/{project.slug}" tabindex="-1" aria-hidden="true">
						<DiagramThumb diagram={diagrams[project.slug]} />
					</a>
					<div class="body">
						<h3><a class="title" href="/projects/{project.slug}">{project.name}</a></h3>
						<p class="tagline">{project.tagline}</p>
						<p>{project.summary}</p>
						<ul class="highlights">
							{#each project.highlights as h (h)}
								<li>{h}</li>
							{/each}
						</ul>
						<ul class="tech" role="list" aria-label="Technologies">
							{#each project.tech as t (t)}
								<li class="mono">{t}</li>
							{/each}
						</ul>
						<RepoStats repo={repoName(project.repo)} initial={data.stats[project.slug]} />
						<p class="actions">
							<a href="/projects/{project.slug}"
								>Read more<span class="visually-hidden"> about {project.name}</span> →</a
							>
							<a class="muted" href={project.repo}
								>Source<span class="visually-hidden"> for {project.name}</span></a
							>
						</p>
					</div>
				</article>
			</li>
		{/each}
	</ul>
</section>

<style>
	.hero {
		position: relative;
		isolation: isolate;
		padding-block: 4rem 5rem;
	}
	.hero > :not(.backdrop) {
		max-width: 46rem;
	}
	.backdrop {
		--glow: color-mix(in oklab, var(--accent) 30%, transparent);
		--line: color-mix(in oklab, var(--accent) 14%, transparent);
		position: absolute;
		z-index: -1;
		inset: 0;
		left: 50%;
		width: 100vw;
		translate: -50% 0;
		overflow: hidden;
		pointer-events: none;
		mask-image: linear-gradient(transparent, #000 15%, #000 60%, transparent);
	}
	.backdrop::before,
	.backdrop::after {
		content: '';
		position: absolute;
	}
	.backdrop::before {
		inset: 0;
		background:
			linear-gradient(var(--line) 1px, transparent 1px) 0 0 / 48px 48px,
			linear-gradient(90deg, var(--line) 1px, transparent 1px) 0 0 / 48px 48px;
		mask-image: radial-gradient(ellipse 55% 90% at 35% 50%, #000, transparent 75%);
		animation: pan 40s linear infinite;
	}
	.backdrop::after {
		inset: -25%;
		background:
			radial-gradient(circle at 25% 40%, var(--glow), transparent 30%),
			radial-gradient(circle at 70% 30%, color-mix(in oklab, var(--glow) 60%, transparent), transparent 28%),
			radial-gradient(circle at 55% 70%, color-mix(in oklab, var(--glow) 45%, transparent), transparent 32%);
		filter: blur(48px);
		animation: drift 26s ease-in-out infinite alternate;
	}
	@keyframes pan {
		to {
			background-position: 48px 48px;
		}
	}
	@keyframes drift {
		from {
			transform: translate(-4%, -2%) rotate(0deg) scale(1);
		}
		to {
			transform: translate(5%, 3%) rotate(12deg) scale(1.08);
		}
	}
	.eyebrow {
		color: var(--accent);
		margin: 0 0 0.75rem;
		font-size: 0.95rem;
	}
	h1 {
		font-size: clamp(2rem, 5vw, 3rem);
		margin: 0 0 1.25rem;
	}
	.lede {
		font-size: 1.15rem;
		color: var(--muted);
	}
	.buttons {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
		margin: 2rem 0 0;
	}
	.button {
		padding: 0.65rem 1.25rem;
		border: 1px solid var(--border);
		border-radius: 8px;
		background: var(--surface);
		color: var(--text);
		font-weight: 600;
		text-decoration: none;
		transition:
			border-color 0.15s,
			background-color 0.15s;
	}
	.button:hover {
		border-color: var(--accent);
	}
	.button.primary {
		background: var(--accent);
		border-color: var(--accent);
		color: var(--bg);
	}
	.button.primary:hover {
		background: color-mix(in oklab, var(--accent) 85%, var(--text));
	}
	h2 {
		font-size: 1.5rem;
	}
	.grid {
		list-style: none;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 24rem), 1fr));
		gap: 1.5rem;
	}
	.grid > li {
		display: flex;
	}
	.card {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 12px;
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease,
			border-color 0.2s ease;
	}
	.card:hover,
	.card:focus-within {
		transform: translateY(-4px);
		border-color: color-mix(in oklab, var(--accent) 55%, var(--border));
		box-shadow: 0 12px 32px -12px color-mix(in oklab, var(--accent) 35%, transparent);
	}
	.card:hover :global(.edge) {
		animation: flow 0.8s linear infinite;
	}
	@keyframes flow {
		to {
			stroke-dashoffset: -18;
		}
	}
	.preview {
		display: block;
		aspect-ratio: 2 / 1;
		padding: 0.75rem;
		border-bottom: 1px solid var(--border);
		background:
			radial-gradient(color-mix(in oklab, var(--muted) 22%, transparent) 1px, transparent 1px) 0 0 /
				14px 14px,
			linear-gradient(var(--accent-soft), var(--accent-soft)),
			var(--bg);
	}
	.body {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 1.5rem;
	}
	.card h3 {
		margin: 0;
		font-size: 1.25rem;
	}
	.tagline {
		color: var(--accent);
		margin: 0.35rem 0 0;
		font-size: 0.95rem;
	}
	.highlights {
		padding-left: 1.1rem;
		color: var(--muted);
		font-size: 0.925rem;
	}
	.highlights li + li {
		margin-top: 0.35rem;
	}
	.tech {
		list-style: none;
		padding: 0;
		margin: 0.5rem 0 1rem;
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}
	.tech li {
		font-size: 0.75rem;
		padding: 0.15rem 0.55rem;
		border-radius: 999px;
		border: 1px solid color-mix(in oklab, var(--accent) 30%, transparent);
		/* Tint over the page color, not the card's, so small accent text keeps 4.5:1 in light mode. */
		background: linear-gradient(var(--accent-soft), var(--accent-soft)), var(--bg);
		color: var(--accent);
	}
	.title {
		color: var(--text);
		text-decoration: none;
	}
	.title:hover {
		color: var(--accent);
	}
	.actions {
		margin: auto 0 0;
		padding-top: 1rem;
		display: flex;
		justify-content: space-between;
		font-weight: 600;
	}
	.actions .muted {
		color: var(--muted);
	}
	@media (prefers-reduced-motion: reduce) {
		.backdrop::before,
		.backdrop::after,
		.card:hover :global(.edge) {
			animation: none;
		}
		.card {
			transition: border-color 0.2s ease;
		}
		.card:hover,
		.card:focus-within {
			transform: none;
		}
	}
</style>
