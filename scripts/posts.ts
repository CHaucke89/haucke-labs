import { existsSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Marked, type Tokens } from 'marked';
import { bundledLanguages, codeToHtml } from 'shiki';
import type { Plugin } from 'vite';
import { parse } from 'yaml';

const root = fileURLToPath(new URL('..', import.meta.url));
const WORDS_PER_MINUTE = 220;

type HighlightedCode = Tokens.Code & { html: string };

export const ogImagePath = (slug: string) => `/og/blog-${slug}.png`;

export function readPost(source: string, file: string) {
	const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(source);
	if (!match) throw new Error(`${file}: missing frontmatter`);
	const meta = parse(match[1]) ?? {};
	for (const key of ['title', 'description']) {
		if (typeof meta[key] !== 'string' || !meta[key]) throw new Error(`${file}: frontmatter needs "${key}"`);
	}
	if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.date)) {
		throw new Error(`${file}: frontmatter "date" must be YYYY-MM-DD`);
	}
	return {
		slug: basename(file, '.md'),
		title: meta.title as string,
		description: meta.description as string,
		date: meta.date as string,
		tags: Array.isArray(meta.tags) ? meta.tags.map(String) : [],
		draft: meta.draft === true,
		body: source.slice(match[0].length)
	};
}

const marked = new Marked({
	async: true,
	async walkTokens(token) {
		if (token.type !== 'code') return;
		(token as HighlightedCode).html = await codeToHtml(token.text, {
			lang: token.lang in bundledLanguages ? token.lang : 'text',
			themes: { light: 'github-light', dark: 'github-dark' },
			defaultColor: false,
			// The stock colors for these are under 4.5:1 on the code background.
			colorReplacements: {
				'github-light': { '#6a737d': '#59636e', '#d73a49': '#cf222e', '#e36209': '#c2410c' },
				'github-dark': { '#6a737d': '#9aa5b1' }
			}
		});
	},
	renderer: {
		code: (token) => (token as HighlightedCode).html
	}
});

async function renderPost(source: string, file: string) {
	const { body, ...meta } = readPost(source, file);
	const image = ogImagePath(meta.slug);
	return {
		...meta,
		minutes: Math.max(1, Math.round(body.split(/\s+/).length / WORDS_PER_MINUTE)),
		image: existsSync(join(root, 'static', image)) ? image : undefined,
		html: await marked.parse(body)
	};
}

export function posts(): Plugin {
	return {
		name: 'posts',
		async transform(source, id) {
			if (!id.endsWith('.md')) return;
			return { code: `export default ${JSON.stringify(await renderPost(source, id))};`, map: null };
		}
	};
}
