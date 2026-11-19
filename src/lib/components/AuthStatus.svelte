<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { loginUrl, PROVIDER_IDS, PROVIDERS, type SessionUser } from '#lib/auth.ts';
	import Avatar from '#lib/components/Avatar.svelte';

	// undefined until /auth/me answers, so nothing flashes while it loads.
	let user = $state<SessionUser | null | undefined>(undefined);
	let menu = $state<HTMLDetailsElement>();

	onMount(() => {
		fetch('/auth/me')
			.then((res): Promise<{ user: SessionUser | null }> => (res.ok ? res.json() : Promise.resolve({ user: null })))
			.then((data) => (user = data.user))
			.catch(() => (user = null));
	});

	function closeOnOutsideClick(event: MouseEvent) {
		if (menu?.open && !menu.contains(event.target as Node)) menu.open = false;
	}
</script>

<svelte:window onclick={closeOnOutsideClick} onkeydown={(e) => e.key === 'Escape' && menu && (menu.open = false)} />

{#if user}
	<form method="POST" action="/auth/logout" class="auth">
		<Avatar src={user.avatar} name={user.name} size={20} />
		<span class="visually-hidden">Signed in with {PROVIDERS[user.provider]} as {user.name}.</span>
		<input type="hidden" name="next" value={page.url.pathname} />
		<button type="submit">Sign out</button>
	</form>
{:else if user === null}
	<details class="auth" bind:this={menu}>
		<summary>Sign in</summary>
		<ul>
			{#each PROVIDER_IDS as id (id)}
				<li><a href={loginUrl(id, page.url.pathname)} data-sveltekit-reload>{PROVIDERS[id]}</a></li>
			{/each}
		</ul>
	</details>
{/if}

<style>
	.auth {
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		margin: 0;
		color: var(--muted);
	}
	summary {
		list-style: none;
		cursor: pointer;
	}
	summary::-webkit-details-marker {
		display: none;
	}
	summary:hover,
	button:hover,
	ul a:hover {
		color: var(--text);
	}
	ul {
		position: absolute;
		top: calc(100% + 0.5rem);
		right: 0;
		z-index: 10;
		min-width: 8rem;
		margin: 0;
		padding: 0.35rem;
		list-style: none;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 0.5rem;
	}
	ul a {
		display: block;
		padding: 0.35rem 0.6rem;
		color: var(--muted);
		text-decoration: none;
		white-space: nowrap;
	}
	button {
		padding: 0;
		font: inherit;
		color: var(--muted);
		background: none;
		border: 0;
		cursor: pointer;
	}
</style>
