import { projects } from '#lib/projects.ts';
import { posts, tags } from '#lib/server/posts.ts';
import { SITE_URL } from '#lib/site.ts';
import type { RequestHandler } from './$types';

export const prerender = true;

export const GET: RequestHandler = () => {
	const paths = [
		'/',
		'/contributions',
		'/blog',
		'/lab',
		'/guestbook',
		'/guestbook/angular',
		'/guestbook/react',
		'/ask',
		'/about',
		...projects.map((p) => `/projects/${p.slug}`),
		...posts.map((p) => `/blog/${p.slug}`),
		...tags.map((t) => `/blog/tags/${t.slug}`)
	];
	const urls = paths.map((path) => `\t<url><loc>${new URL(path, SITE_URL).href}</loc></url>`);
	const body = [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
		...urls,
		'</urlset>',
		''
	].join('\n');
	return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
