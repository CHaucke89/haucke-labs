---
title: How this blog works
date: 2026-11-15
description: A placeholder post showing the format. Posts are Markdown files in the repo, rendered to HTML when the site builds.
tags: [SvelteKit, Markdown]
---

This is a placeholder post. Replace it with a real one, or delete it.

## Writing a post

Each post is a Markdown file in `src/posts/`. The file name becomes the URL, so this one lives at `/blog/hello-blog`. The block at the top sets the title, date, description and tags.

The page title comes from that block, so headings in the body start at `##`.

## Code blocks

Name the language after the opening fence and the block is highlighted at build time, so no highlighting code ships to the browser:

```ts
const dateFormat = new Intl.DateTimeFormat('en-US', {
	month: 'short',
	day: 'numeric',
	year: 'numeric',
	timeZone: 'UTC' // same output on the server and in the browser
});

export const formatDate = (iso: string) => dateFormat.format(new Date(iso));
```

```sh
pnpm dev   # preview the post at localhost:5173/blog
```

## Everything else

The usual Markdown works: **bold**, *italic*, `inline code`, [links](https://hauckelabs.dev), lists, tables and quotes.

> Add `draft: true` to the top block to keep a post out of the live site while you work on it.
