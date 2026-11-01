<svelte:head>
	<title>About · Haucke Labs</title>
	<meta name="description" content="About Christopher Haucke." />
</svelte:head>

<article>
	<h1>About me</h1>

	<!-- DRAFT BIO: replace with your own words. -->
	<p class="lede">
		I’m Chris Haucke. I’m working my way into software engineering, and I learn best by building
		things I actually use.
	</p>

	<p>
		My day job puts me close to the machines: setting up and supporting Windows workstations for
		imaging systems. When that setup turned into a long checklist of repetitive steps, I wrote the
		<a href="https://github.com/CHaucke89/canfield-deployment-toolkit">Canfield Deployment Toolkit</a>
		to turn it into one guided app, with automated builds and releases on GitHub.
	</p>

	<p>
		Outside of work I maintain <a href="https://github.com/CHaucke89/cloudypilot">cloudypilot</a>,
		my fork of the open source driver-assistance software sunnypilot, running on my own car. Keeping
		a fork current with a fast-moving upstream has taught me to read unfamiliar code carefully, keep
		changes small, and contribute fixes back: one of my features is now part of sunnypilot itself.
		When openpilot rewrote its UI and broke the remote-display tool I relied on, I ported it to the
		new stack as <a href="https://github.com/CHaucke89/op-remote-ui-raylib">op-remote-ui-raylib</a>.
	</p>

	<p>
		Right now I’m broadening my skills across the stack, from Python and C++ on embedded Linux to
		web development. This site is part of that too: it’s built with SvelteKit and TypeScript and
		deployed on Cloudflare.
	</p>

	<h2>Get in touch</h2>
	<ul>
		<li><a href="https://github.com/CHaucke89">GitHub: CHaucke89</a></li>
	</ul>
</article>

<style>
	article {
		max-width: 42rem;
		padding-block: 2rem;
	}
	h1 {
		font-size: clamp(2rem, 5vw, 2.75rem);
	}
	.lede {
		font-size: 1.2rem;
	}
	h2 {
		margin-top: 2.5rem;
	}
</style>
