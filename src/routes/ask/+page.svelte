<script lang="ts">
	import Seo from '#lib/components/Seo.svelte';
	import { MAX_QUESTION, SUGGESTIONS, trimHistory, type AskEvent, type ChatMessage } from '#lib/ask.ts';

	type Turn = ChatMessage & { error?: string };

	let turns = $state<Turn[]>([]);
	let question = $state('');
	let controller = $state<AbortController | null>(null);
	let length = $derived([...question.trim()].length);
	let busy = $derived(controller !== null);
	let input: HTMLTextAreaElement;

	const URL_PATTERN = /(https?:\/\/[^\s)]+[^\s).,;:!?'"])/;

	/** Splits an answer into text and links, so URLs are clickable without rendering HTML. */
	const parts = (text: string) =>
		text.split(URL_PATTERN).map((value, i) => ({ value, link: i % 2 === 1 }));

	async function ask(text: string) {
		const content = text.trim();
		if (!content || busy || [...content].length > MAX_QUESTION) return;

		const history = turns.filter((t) => !t.error).map(({ role, content }) => ({ role, content }));
		const messages = trimHistory([...history, { role: 'user', content }]);
		turns.push({ role: 'user', content }, { role: 'assistant', content: '' });
		const reply = turns[turns.length - 1];
		question = '';
		controller = new AbortController();

		try {
			const res = await fetch('/api/ask', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ messages }),
				signal: controller.signal
			});
			if (!res.ok || !res.body) {
				const body = (await res.json().catch(() => null)) as { error?: string } | null;
				reply.error = body?.error ?? 'Something went wrong. Try again later.';
				return;
			}

			let buffer = '';
			for await (const chunk of res.body.pipeThrough(new TextDecoderStream())) {
				buffer += chunk;
				const lines = buffer.split('\n');
				buffer = lines.pop()!;
				for (const line of lines.filter(Boolean)) {
					const event: AskEvent = JSON.parse(line);
					if ('text' in event) reply.content += event.text;
					else if ('error' in event) reply.error = event.error;
					else if (event.truncated) reply.content += '…';
				}
			}
		} catch (err) {
			reply.error = (err as Error).name === 'AbortError' ? 'Stopped.' : 'Couldn’t reach the assistant.';
		} finally {
			controller = null;
			// A failed exchange is left out of later requests, so drop its question too.
			if (reply.error) turns[turns.length - 2].error = reply.error;
			input?.focus();
		}
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
			e.preventDefault();
			ask(question);
		}
	}
</script>

<Seo
	title="Ask about my work"
	description="Ask an AI assistant about Christopher Haucke’s projects, skills and writing. It answers only from this site’s own content."
/>

<section>
	<header>
		<h1>Ask about my work</h1>
		<p class="lede">
			Ask a question about my projects, skills or blog posts. Answers come from Claude, using only
			this site’s project write-ups, their READMEs, the About page and the blog, and it should say so
			when it doesn’t know.
		</p>
		<p class="note">
			It can still get things wrong, so check the pages it links to. Questions are sent to Anthropic’s
			API and aren’t stored here.
		</p>
	</header>

	{#if turns.length === 0}
		<div class="suggestions">
			<p id="try">Try one of these:</p>
			<ul aria-labelledby="try">
				{#each SUGGESTIONS as s (s)}
					<li><button type="button" class="chip" onclick={() => ask(s)}>{s}</button></li>
				{/each}
			</ul>
		</div>
	{/if}

	<ol class="log" role="log" aria-label="Conversation" aria-busy={busy}>
		{#each turns as turn, i (i)}
			<li class={turn.role}>
				<span class="visually-hidden">{turn.role === 'user' ? 'You asked:' : 'Assistant:'}</span>
				{#if turn.role === 'assistant'}
					{#if turn.content}
						<p>
							{#each parts(turn.content) as part, j (j)}{#if part.link}<a href={part.value}>{part.value}</a
									>{:else}{part.value}{/if}{/each}
						</p>
					{:else if !turn.error}
						<p class="thinking">Thinking…</p>
					{/if}
					{#if turn.error}<p class="error">{turn.error}</p>{/if}
				{:else}
					<p>{turn.content}</p>
				{/if}
			</li>
		{/each}
	</ol>

	<form
		onsubmit={(e) => {
			e.preventDefault();
			ask(question);
		}}
	>
		<label for="question">Your question</label>
		<textarea
			id="question"
			rows="2"
			maxlength={MAX_QUESTION * 2}
			placeholder="What did Chris learn maintaining a fork?"
			bind:this={input}
			bind:value={question}
			{onkeydown}
		></textarea>
		<div class="row">
			<span class="count mono" class:over={length > MAX_QUESTION}>{length}/{MAX_QUESTION}</span>
			{#if turns.length && !busy}
				<button type="button" class="secondary" onclick={() => (turns = [])}>Clear</button>
			{/if}
			{#if busy}
				<button type="button" class="secondary" onclick={() => controller?.abort()}>Stop</button>
			{/if}
			<button type="submit" disabled={busy || length === 0 || length > MAX_QUESTION}>Ask</button>
		</div>
	</form>
</section>

<style>
	section {
		padding-block: 2rem;
		max-width: 42rem;
	}
	h1 {
		font-size: clamp(2rem, 5vw, 2.75rem);
	}
	.lede {
		font-size: 1.2rem;
	}
	.note {
		color: var(--muted);
		font-size: 0.9rem;
	}
	.suggestions ul {
		list-style: none;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	.chip {
		text-align: left;
		color: var(--text);
		background: var(--surface);
		border-color: var(--border);
	}
	.chip:hover {
		border-color: var(--accent);
	}
	.log {
		list-style: none;
		padding: 0;
		margin: 1.5rem 0;
		display: grid;
		gap: 0.75rem;
	}
	.log:empty {
		display: none;
	}
	.log li {
		padding: 0.75rem 1rem;
		border-radius: 0.5rem;
		border: 1px solid var(--border);
	}
	.log .user {
		justify-self: end;
		max-width: 85%;
		background: var(--accent-soft);
		border-color: transparent;
	}
	.log .assistant {
		background: var(--surface);
	}
	.log p {
		margin: 0;
		white-space: pre-line;
		overflow-wrap: anywhere;
	}
	.thinking {
		color: var(--muted);
	}
	form {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	label {
		font-weight: 600;
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
	button {
		padding: 0.45rem 1rem;
		font: inherit;
		color: var(--bg);
		background: var(--accent);
		border: 1px solid var(--accent);
		border-radius: 0.5rem;
		cursor: pointer;
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
</style>
