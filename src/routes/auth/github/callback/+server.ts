import { error, redirect } from '@sveltejs/kit';
import {
	callbackUrl,
	exchangeCode,
	fetchGitHubUser,
	OAUTH_COOKIE,
	oauthConfig,
	type OAuthState
} from '#lib/server/github-oauth.ts';
import { setSession } from '#lib/server/session.ts';
import type { RequestHandler } from './$types';

export const prerender = false;

export const GET: RequestHandler = async ({ url, cookies }) => {
	const config = oauthConfig();
	if (!config) error(503, 'Sign-in is not configured');

	const raw = cookies.get(OAUTH_COOKIE);
	cookies.delete(OAUTH_COOKIE, { path: '/auth/github' });
	let login: OAuthState;
	try {
		login = JSON.parse(raw ?? '');
	} catch {
		error(400, 'Sign-in expired. Please try again.');
	}

	// The state proves this callback answers a login this browser started, which blocks login CSRF.
	if (url.searchParams.get('state') !== login.state) error(400, 'Sign-in state did not match');

	// The visitor pressed Cancel on GitHub's consent screen.
	if (url.searchParams.has('error')) redirect(303, login.next);

	const code = url.searchParams.get('code');
	if (!code) error(400, 'Missing authorization code');

	const token = await exchangeCode(config, code, login.verifier, callbackUrl(url.origin));
	if (!token) error(502, 'GitHub rejected the sign-in');

	const user = await fetchGitHubUser(token);
	if (!user) error(502, 'Could not read your GitHub profile');

	await setSession(cookies, user);
	redirect(303, login.next);
};
