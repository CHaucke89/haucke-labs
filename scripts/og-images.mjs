// Generates the social preview images in static/og/ and the home screen icon in static/.
//
// Run it after changing a project's name, tagline or tech list:
//   node scripts/og-images.mjs
//
// Needs Node 22.18 or later (to import the TypeScript project data) and a local Chrome or
// Chromium. Set CHROME=/path/to/chrome if it isn't found automatically. If pngquant is
// installed, the images are compressed afterwards.

import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { projects } from '../src/lib/projects.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const ogDir = join(root, 'static', 'og');

const ACCENT = '#fb923c';
const BG = '#0d1117';
const TEXT = '#e6edf3';
const MUTED = '#9aa5b1';
const MONO = "'JetBrains Mono', ui-monospace, Menlo, 'DejaVu Sans Mono', monospace";
const SANS = "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

function which(name) {
	try {
		return execFileSync('which', [name], { encoding: 'utf8' }).trim();
	} catch {
		return '';
	}
}

const chrome =
	process.env.CHROME ||
	['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser'].map(which).find(Boolean);
if (!chrome) throw new Error('Chrome not found. Set CHROME=/path/to/chrome and try again.');

const escape = (s) =>
	s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// Stops lines breaking inside words like "real-time".
const keepHyphenatedWords = (s) => s.replace(/\w+(?:-\w+)+/g, '<span class="nw">$&</span>');

function card({ title, subtitle, chips, url }) {
	return `<!doctype html><html><head><meta charset="utf-8"><style>
	* { margin: 0; box-sizing: border-box; }
	html, body { width: 1200px; height: 630px; overflow: hidden; }
	body { background: ${BG}; color: ${TEXT}; font-family: ${SANS}; padding: 64px 80px 60px;
		display: flex; flex-direction: column; border-left: 14px solid ${ACCENT}; }
	.brand { font: 700 30px/1 ${MONO}; }
	.brand span { color: ${ACCENT}; }
	main { margin-block: auto; }
	.nw { white-space: nowrap; }
	h1 { font-size: 80px; line-height: 1.05; font-weight: 800; letter-spacing: -0.02em; }
	p { margin-top: 24px; font-size: 36px; line-height: 1.3; color: ${MUTED}; max-width: 980px; }
	footer { display: flex; justify-content: space-between; align-items: center; gap: 24px; }
	ul { list-style: none; padding: 0; display: flex; flex-wrap: wrap; gap: 12px; }
	li { font: 600 22px/1 ${MONO}; color: ${ACCENT}; background: rgb(251 146 60 / 0.14);
		padding: 10px 16px; border-radius: 999px; }
	.url { font: 500 24px/1 ${MONO}; color: ${MUTED}; white-space: nowrap; }
	</style></head><body>
	<div class="brand">haucke<span>labs</span></div>
	<main><h1>${escape(title)}</h1><p>${keepHyphenatedWords(escape(subtitle))}</p></main>
	<footer><ul>${chips.map((c) => `<li>${escape(c)}</li>`).join('')}</ul>
	<div class="url">${escape(url)}</div></footer>
	</body></html>`;
}

function icon() {
	// Full-bleed square: iOS rounds the corners itself.
	const svg = readFileSync(join(root, 'src/lib/assets/favicon.svg'), 'utf8').replace('rx="7"', 'rx="0"');
	return `<!doctype html><html><head><style>
	* { margin: 0; } html, body { width: 180px; height: 180px; overflow: hidden; }
	svg { display: block; width: 180px; height: 180px; }
	</style></head><body>${svg}</body></html>`;
}

const jobs = [
	{
		out: join(ogDir, 'home.png'),
		size: '1200,630',
		html: card({
			title: 'Christopher Haucke',
			subtitle:
				'Open source projects: driver-assistance software, real-time UI streaming and Windows deployment tooling.',
			chips: projects.map((p) => p.name),
			url: 'hauckelabs.dev'
		})
	},
	...projects.map((p) => ({
		out: join(ogDir, `${p.slug}.png`),
		size: '1200,630',
		html: card({ title: p.name, subtitle: p.tagline, chips: p.tech, url: 'hauckelabs.dev' })
	})),
	{ out: join(root, 'static', 'apple-touch-icon.png'), size: '180,180', html: icon() }
];

mkdirSync(ogDir, { recursive: true });
const tmp = mkdtempSync(join(tmpdir(), 'og-'));
const sandbox = process.getuid?.() === 0 ? ['--no-sandbox'] : [];
const pngquant = which('pngquant');

try {
	for (const [i, job] of jobs.entries()) {
		const page = join(tmp, `${i}.html`);
		writeFileSync(page, job.html);
		execFileSync(
			chrome,
			[
				'--headless',
				...sandbox,
				'--disable-gpu',
				'--hide-scrollbars',
				'--force-device-scale-factor=1',
				`--window-size=${job.size}`,
				`--screenshot=${job.out}`,
				pathToFileURL(page).href
			],
			{ stdio: 'ignore' }
		);
		if (pngquant) {
			execFileSync(pngquant, ['--force', '--skip-if-larger', '--ext', '.png', '--quality', '70-95', job.out]);
		}
		console.log(job.out.slice(root.length));
	}
} finally {
	rmSync(tmp, { recursive: true, force: true });
}
