<script lang="ts">
	import { projects } from '#lib/projects.ts';
</script>

<svelte:head>
	<title>Haucke Labs · Christopher Haucke</title>
	<meta
		name="description"
		content="Open source projects by Christopher Haucke: driver-assistance software, real-time UI streaming and Windows deployment tooling."
	/>
</svelte:head>

<section class="hero">
	<p class="eyebrow mono">Christopher Haucke</p>
	<h1>I build tools that solve the problems in front of me.</h1>
	<p class="lede">
		From driver-assistance software running in my car, to a browser-based remote display for it, to
		the Windows tooling I use at work. Here are the open source projects I’ve built, what was hard
		about them, and how they fit together.
	</p>
	<p class="links">
		<a href="/about">More about me</a>
		<a href="https://github.com/CHaucke89">GitHub profile</a>
	</p>
</section>

<section aria-labelledby="projects-heading">
	<h2 id="projects-heading">Projects</h2>
	<ul class="grid">
		{#each projects as project (project.slug)}
			<li class="card">
				<h3>{project.name}</h3>
				<p class="tagline">{project.tagline}</p>
				<p>{project.summary}</p>
				<ul class="highlights">
					{#each project.highlights as h (h)}
						<li>{h}</li>
					{/each}
				</ul>
				<ul class="tech" aria-label="Technologies">
					{#each project.tech as t (t)}
						<li class="mono">{t}</li>
					{/each}
				</ul>
				<a class="repo" href={project.repo}
					>View source<span class="visually-hidden"> for {project.name}</span> →</a
				>
			</li>
		{/each}
	</ul>
</section>

<style>
	.hero {
		padding-block: 3rem 4rem;
		max-width: 46rem;
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
	.links {
		display: flex;
		gap: 1.5rem;
		flex-wrap: wrap;
	}
	h2 {
		font-size: 1.5rem;
	}
	.grid {
		list-style: none;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 19rem), 1fr));
		gap: 1.25rem;
	}
	.card {
		display: flex;
		flex-direction: column;
		padding: 1.5rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 12px;
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
		margin: 0.5rem 0 1.25rem;
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
	.repo {
		margin-top: auto;
		font-weight: 600;
	}
</style>
