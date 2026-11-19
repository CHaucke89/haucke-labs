import { error, redirect } from '@sveltejs/kit';
import { isProvider } from '#lib/auth.ts';
import { callbackUrl, exchangeCode, getProvider, OAUTH_COOKIE, parseOAuthState } from '#lib/server/oauth.ts';
import { setSession } from '#lib/server/session.ts';
import type { RequestHandler } from './$types';

export const prerender = false;

export const GET: RequestHandler = async ({ url, params, cookies }) => {
	if (!isProvider(params.provider)) error(404, 'Unknown sign-in provider');
	const provider = getProvider(params.provider);
	if (!provider) error(503, 'Sign-in is not configured');

	const login = parseOAuthState(cookies.get(OAUTH_COOKIE));
	cookies.delete(OAUTH_COOKIE, { path: `/auth/${provider.id}` });
	if (!login) error(400, 'Sign-in expired. Please try again.');

	// The state proves this callback answers a login this browser started, which blocks login CSRF.
	if (url.searchParams.get('state') !== login.state) error(400, 'Sign-in state did not match');

	// The visitor pressed Cancel on the provider's consent screen.
	if (url.searchParams.has('error')) redirect(303, login.next);

	const code = url.searchParams.get('code');
	if (!code) error(400, 'Missing authorization code');

	const token = await exchangeCode(provider, code, login.verifier, callbackUrl(url.origin, provider.id));
	if (!token) error(502, `${provider.name} rejected the sign-in`);

	const user = await provider.fetchUser(token);
	if (!user) error(502, `Could not read your ${provider.name} profile`);

	await setSession(cookies, { provider: provider.id, ...user });
	redirect(303, login.next);
};
