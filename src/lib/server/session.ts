import { env } from 'cloudflare:workers';
import type { Cookies } from '@sveltejs/kit';
import { isProvider, type SessionUser } from '#lib/auth.ts';

interface Payload extends SessionUser {
	exp: number;
}

// Rejects cookies from before sign-in had providers, so those visitors just sign in again.
const isPayload = (p: Partial<Payload> | null): p is Payload =>
	isProvider(p?.provider) &&
	typeof p.id === 'string' &&
	typeof p.name === 'string' &&
	(typeof p.avatar === 'string' || p.avatar === null) &&
	typeof p.exp === 'number';

export const SESSION_COOKIE = 'session';
const MAX_AGE_S = 7 * 24 * 60 * 60;

const enc = new TextEncoder();

export function base64url(bytes: Uint8Array): string {
	return btoa(String.fromCharCode(...bytes))
		.replaceAll('+', '-')
		.replaceAll('/', '_')
		.replace(/=+$/, '');
}

function fromBase64url(s: string): Uint8Array<ArrayBuffer> {
	const bin = atob(s.replaceAll('-', '+').replaceAll('_', '/'));
	return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

export function randomToken(): string {
	return base64url(crypto.getRandomValues(new Uint8Array(32)));
}

function hmacKey(): Promise<CryptoKey> {
	const secret = env.SESSION_SECRET;
	if (!secret) throw new Error('SESSION_SECRET is not set');
	return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
		'sign',
		'verify'
	]);
}

export async function setSession(cookies: Cookies, user: SessionUser): Promise<void> {
	const payload: Payload = { ...user, exp: Date.now() + MAX_AGE_S * 1000 };
	const body = base64url(enc.encode(JSON.stringify(payload)));
	const sig = new Uint8Array(await crypto.subtle.sign('HMAC', await hmacKey(), enc.encode(body)));
	cookies.set(SESSION_COOKIE, `${body}.${base64url(sig)}`, {
		path: '/',
		httpOnly: true,
		secure: true,
		sameSite: 'lax',
		maxAge: MAX_AGE_S
	});
}

/** The signed-in user, or null for a missing, tampered or expired cookie. */
export async function readSession(cookies: Cookies): Promise<SessionUser | null> {
	const value = cookies.get(SESSION_COOKIE);
	if (!value || !env.SESSION_SECRET) return null;
	const [body, sig] = value.split('.');
	if (!body || !sig) return null;
	try {
		// subtle.verify compares in constant time, unlike comparing two signature strings.
		const ok = await crypto.subtle.verify('HMAC', await hmacKey(), fromBase64url(sig), enc.encode(body));
		if (!ok) return null;
		const p: Partial<Payload> | null = JSON.parse(new TextDecoder().decode(fromBase64url(body)));
		return isPayload(p) && p.exp > Date.now()
			? { provider: p.provider, id: p.id, name: p.name, avatar: p.avatar }
			: null;
	} catch {
		return null;
	}
}

export function clearSession(cookies: Cookies): void {
	cookies.delete(SESSION_COOKIE, { path: '/' });
}

/** A same-site path to return to after signing in or out; anything else falls back to `/`. */
export function safeNext(next: string | null | undefined): string {
	if (!next?.startsWith('/')) return '/';
	// Parse rather than pattern-match: browsers also read "//x", "/\x" and "/<tab>/x" as another host.
	const url = new URL(next, 'http://local');
	return url.origin === 'http://local' ? url.pathname + url.search + url.hash : '/';
}
