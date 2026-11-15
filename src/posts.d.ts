declare module '*.md' {
	const post: import('#lib/blog.ts').Post;
	export default post;
}
