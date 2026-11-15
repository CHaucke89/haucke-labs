import { tagSlug, type Post, type PostMeta } from '#lib/blog.ts';

const modules = import.meta.glob<Post>('/src/posts/*.md', { eager: true, import: 'default' });

export const posts = Object.values(modules)
	.filter((post) => import.meta.env.DEV || !post.draft)
	.sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));

export const summaries: PostMeta[] = posts.map(({ html: _, ...meta }) => meta);

export const getPost = (slug: string) => posts.find((p) => p.slug === slug);

export const tags = [...new Map(posts.flatMap((p) => p.tags).map((t) => [tagSlug(t), t]))].map(
	([slug, name]) => ({ slug, name })
);
