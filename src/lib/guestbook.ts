import type { ProviderId } from '#lib/auth.ts';

export const MAX_MESSAGE = 280;

export interface GuestbookEntry {
	provider: ProviderId;
	userId: string;
	name: string;
	avatar: string | null;
	message: string;
	createdAt: string;
	updatedAt: string;
}

/** Only GitHub names are public profiles worth linking to. */
export const profileUrl = (entry: GuestbookEntry) =>
	entry.provider === 'github' ? `https://github.com/${entry.name}` : null;

/** Trimmed message with runs of blank lines collapsed, or an error to show the visitor. */
export function cleanMessage(raw: unknown): { message: string } | { error: string } {
	if (typeof raw !== 'string') return { error: 'Write a note first.' };
	const message = raw.replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
	if (!message) return { error: 'Write a note first.' };
	// Counts code points, not UTF-16 units, so an emoji counts as one character.
	if ([...message].length > MAX_MESSAGE) return { error: `Keep it under ${MAX_MESSAGE} characters.` };
	return { message };
}
