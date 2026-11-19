export const PROVIDERS = { github: 'GitHub', google: 'Google' } as const;

export type ProviderId = keyof typeof PROVIDERS;

export const PROVIDER_IDS = Object.keys(PROVIDERS) as ProviderId[];

export const isProvider = (value: unknown): value is ProviderId =>
	typeof value === 'string' && Object.hasOwn(PROVIDERS, value);

/** A visitor is identified by provider plus that provider's id, so accounts are never merged. */
export interface SessionUser {
	provider: ProviderId;
	id: string;
	name: string;
	avatar: string | null;
}

export const loginUrl = (provider: ProviderId, next: string) =>
	`/auth/${provider}/login?next=${encodeURIComponent(next)}`;
