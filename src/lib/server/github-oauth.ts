import { env } from 'cloudflare:workers';
import { base64url } from '#lib/server/session.ts';

export const OAUTH_COOKIE = 'github_oauth';

/** Login state kept in a short-lived cookie between the redirect to GitHub and the callback. */
export interface OAuthState {
	state: string;
	verifier: string;
	next: string;
}

export function oauthConfig(): { clientId: string; clientSecret: string } | null {
	const clientId = env.GITHUB_CLIENT_ID;
	const clientSecret = env.GITHUB_CLIENT_SECRET;
	return clientId && clientSecret && env.SESSION_SECRET ? { clientId, clientSecret } : null;
}

/** PKCE S256: the challenge sent up front is SHA-256 of the verifier sent with the code exchange. */
export async function pkceChallenge(verifier: string): Promise<string> {
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
	return base64url(new Uint8Array(digest));
}

export const callbackUrl = (origin: string) => `${origin}/auth/github/callback`;

const USER_AGENT = 'haucke-labs';

/** Trades the one-time code for an access token, server to server. */
export async function exchangeCode(
	config: { clientId: string; clientSecret: string },
	code: string,
	verifier: string,
	redirectUri: string
): Promise<string | null> {
	const res = await fetch('https://github.com/login/oauth/access_token', {
		method: 'POST',
		headers: { accept: 'application/json', 'user-agent': USER_AGENT },
		body: new URLSearchParams({
			client_id: config.clientId,
			client_secret: config.clientSecret,
			code,
			redirect_uri: redirectUri,
			code_verifier: verifier
		})
	});
	// GitHub reports a bad code as 200 with an `error` field, so check for the token itself.
	const data: { access_token?: string } = res.ok ? await res.json() : {};
	return data.access_token ?? null;
}

export async function fetchGitHubUser(token: string): Promise<{ id: number; login: string } | null> {
	const res = await fetch('https://api.github.com/user', {
		headers: {
			authorization: `Bearer ${token}`,
			accept: 'application/vnd.github+json',
			'user-agent': USER_AGENT
		}
	});
	if (!res.ok) return null;
	const user: { id?: unknown; login?: unknown } = await res.json();
	return typeof user.id === 'number' && typeof user.login === 'string'
		? { id: user.id, login: user.login }
		: null;
}
