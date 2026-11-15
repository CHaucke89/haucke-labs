export type PostMeta = {
	slug: string;
	title: string;
	description: string;
	date: string;
	tags: string[];
	draft: boolean;
	minutes: number;
	image?: string;
};

export type Post = PostMeta & { html: string };

export const tagSlug = (tag: string) =>
	tag
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
