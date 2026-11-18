<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { avatarUrl } from '#lib/guestbook.ts';

	type User = { id: number; login: string };

	// undefined until /auth/me answers, so nothing flashes while it loads.
	let user = $state<User | null | undefined>(undefined);

	onMount(() => {
		fetch('/auth/me')
			.then((res): Promise<{ user: User | null }> => (res.ok ? res.json() : Promise.resolve({ user: null })))
			.then((data) => (user = data.user))
			.catch(() => (user = null));
	});
</script>

{#if user}
	<form method="POST" action="/auth/logout" class="auth">
		<img src={avatarUrl(user.id, 40)} alt="" width="20" height="20" />
		<span class="visually-hidden">Signed in as {user.login}.</span>
		<input type="hidden" name="next" value={page.url.pathname} />
		<button type="submit">Sign out</button>
	</form>
{:else if user === null}
	<a
		class="auth"
		href="/auth/github/login?next={encodeURIComponent(page.url.pathname)}"
		data-sveltekit-reload>Sign in</a
	>
{/if}

<style>
	.auth {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		margin: 0;
		color: var(--muted);
		text-decoration: none;
	}
	.auth:hover,
	button:hover {
		color: var(--text);
	}
	img {
		border-radius: 50%;
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
