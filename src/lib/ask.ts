export const MAX_QUESTION = 500;
export const MAX_ANSWER = 4000;
/** Earlier turns sent back with each question, so follow-ups like "what did he learn from it?" work. */
export const MAX_MESSAGES = 9;

export type ChatMessage = { role: 'user' | 'assistant'; content: string };

/** One line of the NDJSON stream from POST /api/ask. */
export type AskEvent = { text: string } | { error: string } | { done: true; truncated: boolean };

export const SUGGESTIONS = [
	'What is cloudypilot, and what did Chris add to it?',
	'How does the remote UI streamer avoid slowing down the car’s UI?',
	'What languages and tools has Chris worked with?',
	'How is this site built and hosted?'
];

/** The conversation trimmed to what the server accepts: starts and ends with a question. */
export function trimHistory(messages: ChatMessage[]): ChatMessage[] {
	const recent = messages.slice(-MAX_MESSAGES);
	return recent[0]?.role === 'assistant' ? recent.slice(1) : recent;
}

/** Validates a client-sent conversation, or returns an error to show the visitor. */
export function cleanConversation(raw: unknown): { messages: ChatMessage[] } | { error: string } {
	if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_MESSAGES) {
		return { error: 'Send a question.' };
	}
	const messages: ChatMessage[] = [];
	for (const [i, m] of raw.entries()) {
		const role = i % 2 === 0 ? 'user' : 'assistant';
		if (m?.role !== role || typeof m.content !== 'string') return { error: 'Malformed conversation.' };
		const content = m.content.trim();
		const max = role === 'user' ? MAX_QUESTION : MAX_ANSWER;
		if (!content) return { error: 'Write a question first.' };
		if ([...content].length > max) {
			return { error: role === 'user' ? `Keep questions under ${MAX_QUESTION} characters.` : 'Conversation too long.' };
		}
		messages.push({ role, content });
	}
	if (messages.at(-1)!.role !== 'user') return { error: 'Send a question.' };
	return { messages };
}
