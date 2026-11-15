import { error } from '@sveltejs/kit';
import { getPost, posts } from '#lib/server/posts.ts';
import type { EntryGenerator, PageServerLoad } from './$types';

export const entries: EntryGenerator = () => posts.map((p) => ({ slug: p.slug }));

export const load: PageServerLoad = ({ params }) => {
	const post = getPost(params.slug);
	if (!post) error(404, 'Post not found');
	return { post };
};
