import { error, redirect } from '@sveltejs/kit';
import { callbackUrl, OAUTH_COOKIE, oauthConfig, pkceChallenge, type OAuthState } from '#lib/server/github-oauth.ts';
import { randomToken, safeNext } from '#lib/server/session.ts';
import type { RequestHandler } from './$types';

export const prerender = false;

export const GET: RequestHandler = async ({ url, cookies }) => {
	const config = oauthConfig();
	if (!config) error(503, 'Sign-in is not configured');

	const login: OAuthState = {
		state: randomToken(),
		verifier: randomToken(),
		next: safeNext(url.searchParams.get('next'))
	};
	cookies.set(OAUTH_COOKIE, JSON.stringify(login), {
		path: '/auth/github',
		httpOnly: true,
		secure: true,
		// Lax, not Strict: the cookie has to come back on GitHub's top-level redirect to the callback.
		sameSite: 'lax',
		maxAge: 10 * 60
	});

	const authorize = new URL('https://github.com/login/oauth/authorize');
	authorize.search = new URLSearchParams({
		client_id: config.clientId,
		redirect_uri: callbackUrl(url.origin),
		scope: 'read:user',
		state: login.state,
		code_challenge: await pkceChallenge(login.verifier),
		code_challenge_method: 'S256'
	}).toString();
	redirect(302, authorize, { external: ['https://github.com'] });
};
