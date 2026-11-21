<script lang="ts">
	import { onMount } from 'svelte';
	import Seo from '#lib/components/Seo.svelte';
	import GuestbookToggle from '#lib/components/GuestbookToggle.svelte';

	// Added at runtime so Vite doesn't try to bundle the separately built Angular app. Later
	// client-side visits reuse the <hl-guestbook> element it already defined.
	onMount(() => {
		if (customElements.get('hl-guestbook')) return;
		const script = document.createElement('script');
		script.type = 'module';
		script.src = '/ng-guestbook/main.js';
		document.head.appendChild(script);
	});
</script>

<Seo
	title="Guestbook (Angular)"
	description="The same guestbook as an Angular web component, sharing one JSON API with the Svelte version."
/>

<section>
	<header>
		<h1>Guestbook</h1>
		<p class="lede">
			The same guestbook, built as an Angular web component and embedded in this SvelteKit page. All
			three versions read and write the same notes.
		</p>
		<GuestbookToggle current="angular" />
	</header>

	<hl-guestbook></hl-guestbook>
	<noscript>
		<p>This version needs JavaScript. <a href="/guestbook">The Svelte version</a> works without it.</p>
	</noscript>
</section>

<style>
	section {
		padding-block: 2rem;
	}
	h1 {
		font-size: clamp(2rem, 5vw, 2.75rem);
	}
	.lede {
		font-size: 1.2rem;
		max-width: 42rem;
	}
</style>
