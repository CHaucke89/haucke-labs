import { error } from '@sveltejs/kit';
import { tagSlug } from '#lib/blog.ts';
import { summaries, tags } from '#lib/server/posts.ts';
import type { EntryGenerator, PageServerLoad } from './$types';

export const entries: EntryGenerator = () => tags.map((t) => ({ tag: t.slug }));

export const load: PageServerLoad = ({ params }) => {
	const tag = tags.find((t) => t.slug === params.tag);
	if (!tag) error(404, 'Tag not found');
	return {
		tag: tag.name,
		posts: summaries.filter((p) => p.tags.some((t) => tagSlug(t) === tag.slug))
	};
};
