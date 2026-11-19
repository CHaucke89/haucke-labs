<script lang="ts">
	import { enhance } from '$app/forms';
	import Seo from '#lib/components/Seo.svelte';
	import { formatDate } from '#lib/github.ts';
	import { loginUrl, PROVIDER_IDS, PROVIDERS } from '#lib/auth.ts';
	import Avatar from '#lib/components/Avatar.svelte';
	import { MAX_MESSAGE, profileUrl } from '#lib/guestbook.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	// Writable derived: typing overrides it, and it resets to the saved note when the data reloads.
	let draft = $derived(data.mine?.message ?? '');
	let length = $derived([...draft].length);
	let saving = $state(false);
</script>

<Seo
	title="Guestbook"
	description="Sign in with GitHub or Google and leave a short note for Christopher Haucke."
/>

<section>
	<header>
		<h1>Guestbook</h1>
		<p class="lede">
			Sign in with GitHub or Google and leave a note. Only your name and avatar are shown, and you
			can edit or delete your note any time.
		</p>
	</header>

	{#if !data.available}
		<p class="empty">The guestbook isn’t available here.</p>
	{:else if data.user}
		<form
			method="POST"
			action="?/sign"
			use:enhance={() => {
				saving = true;
				return async ({ update }) => {
					await update({ reset: false });
					saving = false;
				};
			}}
		>
			<label for="message">
				Signed in with {PROVIDERS[data.user.provider]} as <strong>{data.user.name}</strong>.
				{data.mine ? 'Edit your note' : 'Leave a note'}:
			</label>
			<textarea id="message" name="message" rows="3" maxlength={MAX_MESSAGE * 2} bind:value={draft}
			></textarea>
			<div class="row">
				<span class="count mono" class:over={length > MAX_MESSAGE}>{length}/{MAX_MESSAGE}</span>
				{#if form?.error}<span class="error" role="alert">{form.error}</span>{/if}
				{#if form?.saved}<span class="saved" role="status">Saved. Thanks!</span>{/if}
				{#if data.mine}
					<button type="submit" formaction="?/delete" class="secondary" disabled={saving}>Delete</button>
				{/if}
				<button type="submit" disabled={saving || length === 0 || length > MAX_MESSAGE}>
					{data.mine ? 'Update' : 'Sign'}
				</button>
			</div>
		</form>
	{:else}
		<p>Sign in to leave a note:</p>
		<div class="row">
			{#each PROVIDER_IDS as id (id)}
				<a class="signin" href={loginUrl(id, '/guestbook')} data-sveltekit-reload>
					Sign in with {PROVIDERS[id]}
				</a>
			{/each}
		</div>
	{/if}

	{#if data.available}
		{#if data.entries.length === 0}
			<p class="empty">No notes yet. Be the first.</p>
		{:else}
			<ol class="entries">
				{#each data.entries as entry (`${entry.provider}:${entry.userId}`)}
					{@const profile = profileUrl(entry)}
					<li>
						<Avatar src={entry.avatar} name={entry.name} size={40} />
						<div>
							<p class="meta">
								{#if profile}<a href={profile}>{entry.name}</a>{:else}<strong>{entry.name}</strong>{/if}
								<span class="via">via {PROVIDERS[entry.provider]}</span>
								<time datetime={entry.createdAt}>{formatDate(entry.createdAt)}</time>
							</p>
							<p class="message">{entry.message}</p>
						</div>
					</li>
				{/each}
			</ol>
		{/if}
	{/if}
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
	form {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		max-width: 42rem;
	}
	textarea {
		font: inherit;
		color: var(--text);
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		padding: 0.75rem;
		resize: vertical;
	}
	textarea:focus-visible,
	button:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
	.row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.75rem;
	}
	.count {
		color: var(--muted);
		font-size: 0.85rem;
		margin-right: auto;
	}
	.count.over,
	.error {
		color: #f85149;
	}
	.saved {
		color: #3fb950;
	}
	button,
	.signin {
		padding: 0.45rem 1rem;
		font: inherit;
		color: var(--bg);
		background: var(--accent);
		border: 1px solid var(--accent);
		border-radius: 0.5rem;
		cursor: pointer;
		text-decoration: none;
	}
	.signin {
		display: inline-block;
	}
	button.secondary {
		color: var(--muted);
		background: transparent;
		border-color: var(--border);
	}
	button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.entries {
		list-style: none;
		padding: 0;
		margin-top: 2.5rem;
		display: grid;
		gap: 1rem;
	}
	.entries li {
		display: flex;
		gap: 0.85rem;
		padding: 1rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 0.5rem;
	}
	.meta {
		margin: 0;
		display: flex;
		gap: 0.75rem;
		align-items: baseline;
	}
	.meta .via,
	.meta time {
		color: var(--muted);
		font-size: 0.85rem;
	}
	.message {
		margin: 0.25rem 0 0;
		white-space: pre-line;
		overflow-wrap: anywhere;
	}
	.empty {
		color: var(--muted);
	}
</style>
