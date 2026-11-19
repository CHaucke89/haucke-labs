import { error, redirect } from '@sveltejs/kit';
import { isProvider } from '#lib/auth.ts';
import { callbackUrl, getProvider, OAUTH_COOKIE, pkceChallenge, type OAuthState } from '#lib/server/oauth.ts';
import { randomToken, safeNext } from '#lib/server/session.ts';
import type { RequestHandler } from './$types';

export const prerender = false;

export const GET: RequestHandler = async ({ url, params, cookies }) => {
	if (!isProvider(params.provider)) error(404, 'Unknown sign-in provider');
	const provider = getProvider(params.provider);
	if (!provider) error(503, 'Sign-in is not configured');

	const login: OAuthState = {
		state: randomToken(),
		verifier: randomToken(),
		next: safeNext(url.searchParams.get('next'))
	};
	cookies.set(OAUTH_COOKIE, JSON.stringify(login), {
		path: `/auth/${provider.id}`,
		httpOnly: true,
		secure: true,
		// Lax, not Strict: the cookie has to come back on the provider's top-level redirect to the callback.
		sameSite: 'lax',
		maxAge: 10 * 60
	});

	const authorize = new URL(provider.authorizeUrl);
	authorize.search = new URLSearchParams({
		response_type: 'code',
		client_id: provider.clientId,
		redirect_uri: callbackUrl(url.origin, provider.id),
		scope: provider.scope,
		state: login.state,
		code_challenge: await pkceChallenge(login.verifier),
		code_challenge_method: 'S256'
	}).toString();
	redirect(302, authorize, { external: [authorize.origin] });
};
