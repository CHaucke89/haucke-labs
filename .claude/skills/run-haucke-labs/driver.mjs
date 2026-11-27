#!/usr/bin/env node
// Headless Chromium REPL for the haucke-labs dev server. One command per line on stdin.
// Usage: node .claude/skills/run-haucke-labs/driver.mjs [--base http://localhost:5173] < script
import { createRequire } from 'node:module';
import { readFileSync, mkdirSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { createHmac } from 'node:crypto';
import { resolve } from 'node:path';

// ESM ignores NODE_PATH, so resolve a globally installed playwright through require.
const require = createRequire(import.meta.url);
let playwright;
try {
	playwright = require('playwright');
} catch {
	const global = process.env.NODE_PATH?.split(':').find(Boolean);
	playwright = require(global ? resolve(global, 'playwright') : 'playwright');
}

const args = process.argv.slice(2);
const base = (args.includes('--base') ? args[args.indexOf('--base') + 1] : 'http://localhost:5173').replace(/\/$/, '');
const shotDir = process.env.SHOT_DIR ?? '/tmp/haucke-labs-shots';
mkdirSync(shotDir, { recursive: true });

function devVar(name) {
	try {
		const line = readFileSync('.dev.vars', 'utf8').split('\n').find((l) => l.startsWith(name + '='));
		return line?.slice(name.length + 1).trim() || undefined;
	} catch {
		return undefined;
	}
}

const b64url = (buf) => Buffer.from(buf).toString('base64url');

// Mirrors setSession in src/lib/server/session.ts: base64url(JSON) + "." + base64url(HMAC-SHA256).
function sessionCookie(name) {
	const secret = devVar('SESSION_SECRET');
	if (!secret) throw new Error('SESSION_SECRET is empty in .dev.vars');
	const body = b64url(JSON.stringify({ provider: 'github', id: 'agent-' + name, name, avatar: null, exp: Date.now() + 864e5 }));
	return `${body}.${b64url(createHmac('sha256', secret).update(body).digest())}`;
}

const browser = await playwright.chromium.launch({ args: ['--no-sandbox'] });
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(e.message));
let shots = 0;

const url = (p) => (p.startsWith('http') ? p : base + (p.startsWith('/') ? p : '/' + p));
const target = (s) => (s.startsWith('text=') ? page.getByText(s.slice(5)).first() : page.locator(s).first());

const commands = {
	nav: async (p = '/') => {
		const r = await page.goto(url(p), { waitUntil: 'load' });
		return `${r?.status()} ${page.url()}`;
	},
	'wait-for': async (s) => (await target(s).waitFor({ timeout: 30000 }), 'ok'),
	click: async (s) => (await target(s).click(), 'ok'),
	fill: async (rest) => {
		const [s, ...text] = rest.split(' ');
		await target(s).fill(text.join(' '));
		return 'ok';
	},
	press: async (k) => (await page.keyboard.press(k), 'ok'),
	text: async (s = 'main') => (await target(s).innerText()).slice(0, 2000),
	eval: async (js) => JSON.stringify(await page.evaluate(js)),
	screenshot: async (name) => {
		const file = `${shotDir}/${name || String(++shots).padStart(2, '0')}.png`;
		await page.screenshot({ path: file, fullPage: true });
		return file;
	},
	login: async (name = 'Agent') => {
		await context.addCookies([{ name: 'session', value: sessionCookie(name), url: base, httpOnly: true, sameSite: 'Lax' }]);
		return `session cookie set for ${name}`;
	},
	logout: async () => (await context.clearCookies(), 'cookies cleared'),
	'push-lab': async (json) => {
		const token = devVar('LAB_INGEST_TOKEN') ?? 'dev-token-change-me';
		const body =
			json ||
			JSON.stringify({
				readings: [
					{ id: 'office_temp', label: 'Office', group: 'Climate', value: 21.4, unit: '°C' },
					{ id: 'printer', label: 'Printer', group: '3D printer', value: 'printing' },
					{ id: 'progress', label: 'Progress', group: '3D printer', value: 42, unit: '%' }
				]
			});
		const r = await fetch(base + '/api/lab', {
			method: 'POST',
			headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
			body
		});
		return `${r.status} ${await r.text()}`;
	},
	console: async () => (errors.length ? errors.splice(0).join('\n') : 'no errors'),
	quit: async () => {
		await browser.close();
		process.exit(0);
	}
};

const rl = createInterface({ input: process.stdin });
for await (const raw of rl) {
	const line = raw.trim();
	if (!line || line.startsWith('#')) continue;
	const i = line.indexOf(' ');
	const [cmd, rest] = i < 0 ? [line, ''] : [line.slice(0, i), line.slice(i + 1)];
	const fn = commands[cmd];
	try {
		console.log(`> ${line}\n${fn ? await fn(rest || undefined) : `unknown command; try: ${Object.keys(commands).join(' ')}`}`);
	} catch (e) {
		console.log(`> ${line}\nERROR ${e.message.split('\n')[0]}`);
		process.exitCode = 1;
	}
}
await browser.close();
