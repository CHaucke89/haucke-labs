export const MAX_MESSAGE = 280;

export interface GuestbookEntry {
	userId: number;
	login: string;
	message: string;
	createdAt: string;
	updatedAt: string;
}

export const avatarUrl = (userId: number, size = 64) =>
	`https://avatars.githubusercontent.com/u/${userId}?s=${size}`;

/** Trimmed message with runs of blank lines collapsed, or an error to show the visitor. */
export function cleanMessage(raw: unknown): { message: string } | { error: string } {
	if (typeof raw !== 'string') return { error: 'Write a note first.' };
	const message = raw.replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
	if (!message) return { error: 'Write a note first.' };
	// Counts code points, not UTF-16 units, so an emoji counts as one character.
	if ([...message].length > MAX_MESSAGE) return { error: `Keep it under ${MAX_MESSAGE} characters.` };
	return { message };
}
