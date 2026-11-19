import { env } from 'cloudflare:workers';
import { PROVIDERS, type ProviderId, type SessionUser } from '#lib/auth.ts';
import { base64url } from '#lib/server/session.ts';

export const OAUTH_COOKIE = 'oauth';

/** Login state kept in a short-lived cookie between the redirect to the provider and the callback. */
export interface OAuthState {
	state: string;
	verifier: string;
	next: string;
}

export function parseOAuthState(raw: string | undefined): OAuthState | null {
	try {
		const v = JSON.parse(raw ?? '');
		return typeof v?.state === 'string' && typeof v.verifier === 'string' && typeof v.next === 'string'
			? { state: v.state, verifier: v.verifier, next: v.next }
			: null;
	} catch {
		return null;
	}
}

type ProviderUser = Omit<SessionUser, 'provider'>;

interface ProviderConfig {
	authorizeUrl: string;
	tokenUrl: string;
	scope: string;
	credentials: () => { clientId?: string; clientSecret?: string };
	fetchUser: (token: string) => Promise<ProviderUser | null>;
}

export interface Provider extends ProviderConfig {
	id: ProviderId;
	name: string;
	clientId: string;
	clientSecret: string;
}

const USER_AGENT = 'haucke-labs';

async function getJson(url: string, token: string, accept = 'application/json'): Promise<Record<string, unknown> | null> {
	const res = await fetch(url, {
		headers: { authorization: `Bearer ${token}`, accept, 'user-agent': USER_AGENT }
	});
	return res.ok ? res.json() : null;
}

const PROVIDER_CONFIG: Record<ProviderId, ProviderConfig> = {
	github: {
		authorizeUrl: 'https://github.com/login/oauth/authorize',
		tokenUrl: 'https://github.com/login/oauth/access_token',
		scope: 'read:user',
		credentials: () => ({ clientId: env.GITHUB_CLIENT_ID, clientSecret: env.GITHUB_CLIENT_SECRET }),
		async fetchUser(token) {
			const user = await getJson('https://api.github.com/user', token, 'application/vnd.github+json');
			return typeof user?.id === 'number' && typeof user.login === 'string'
				? {
						id: String(user.id),
						name: user.login,
						avatar: `https://avatars.githubusercontent.com/u/${user.id}?s=80`
					}
				: null;
		}
	},
	google: {
		authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
		tokenUrl: 'https://oauth2.googleapis.com/token',
		// No `email` scope: accounts are keyed by `sub`, and an address is never shown or stored.
		scope: 'openid profile',
		credentials: () => ({ clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET }),
		async fetchUser(token) {
			const user = await getJson('https://openidconnect.googleapis.com/v1/userinfo', token);
			if (typeof user?.sub !== 'string') return null;
			return {
				id: user.sub,
				name: typeof user.name === 'string' && user.name.trim() ? user.name.trim() : 'Google user',
				avatar: typeof user.picture === 'string' && user.picture.startsWith('https://') ? user.picture : null
			};
		}
	}
};

/** The provider with its credentials, or null when it or the session secret isn't configured. */
export function getProvider(id: ProviderId): Provider | null {
	const config = PROVIDER_CONFIG[id];
	const { clientId, clientSecret } = config.credentials();
	return clientId && clientSecret && env.SESSION_SECRET ? { ...config, id, name: PROVIDERS[id], clientId, clientSecret } : null;
}

/** PKCE S256: the challenge sent up front is SHA-256 of the verifier sent with the code exchange. */
export async function pkceChallenge(verifier: string): Promise<string> {
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
	return base64url(new Uint8Array(digest));
}

export const callbackUrl = (origin: string, provider: ProviderId) => `${origin}/auth/${provider}/callback`;

/** Trades the one-time code for an access token, server to server. */
export async function exchangeCode(
	provider: Provider,
	code: string,
	verifier: string,
	redirectUri: string
): Promise<string | null> {
	const res = await fetch(provider.tokenUrl, {
		method: 'POST',
		headers: { accept: 'application/json', 'user-agent': USER_AGENT },
		body: new URLSearchParams({
			grant_type: 'authorization_code',
			client_id: provider.clientId,
			client_secret: provider.clientSecret,
			code,
			redirect_uri: redirectUri,
			code_verifier: verifier
		})
	});
	// GitHub reports a bad code as 200 with an `error` field, so check for the token itself.
	const data: { access_token?: string } = res.ok ? await res.json() : {};
	return data.access_token ?? null;
}
