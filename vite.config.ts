import adapter from "@sveltejs/adapter-cloudflare";
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { posts } from './scripts/posts.ts';

export default defineConfig({
	plugins: [
		posts(),
		sveltekit({
		prerender: {
			// Only the dynamic /guestbook page links here, so the crawler wouldn't find it.
			entries: ['*', '/guestbook/angular'],
			handleUnseenRoutes: 'warn'
		},
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			adapter: adapter()
		})
	]
});