import { posts } from '#lib/server/posts.ts';
import { SITE_NAME, SITE_URL } from '#lib/site.ts';
import type { RequestHandler } from './$types';

export const prerender = true;

const escape = (s: string) =>
	s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c] as string);

export const GET: RequestHandler = () => {
	const items = posts.map((post) => {
		const url = `${SITE_URL}/blog/${post.slug}`;
		return [
			'\t\t<item>',
			`\t\t\t<title>${escape(post.title)}</title>`,
			`\t\t\t<link>${url}</link>`,
			`\t\t\t<guid>${url}</guid>`,
			`\t\t\t<pubDate>${new Date(post.date).toUTCString()}</pubDate>`,
			`\t\t\t<description>${escape(post.description)}</description>`,
			...post.tags.map((tag) => `\t\t\t<category>${escape(tag)}</category>`),
			'\t\t</item>'
		].join('\n');
	});
	const body = [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
		'\t<channel>',
		`\t\t<title>${SITE_NAME} blog</title>`,
		`\t\t<link>${SITE_URL}/blog</link>`,
		'\t\t<description>Tutorials and notes by Christopher Haucke.</description>',
		'\t\t<language>en-us</language>',
		`\t\t<atom:link href="${SITE_URL}/blog/rss.xml" rel="self" type="application/rss+xml" />`,
		...items,
		'\t</channel>',
		'</rss>',
		''
	].join('\n');
	return new Response(body, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
