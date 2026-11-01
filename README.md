# Haucke Labs

Source for [hauckelabs.dev](https://hauckelabs.dev), a showcase of my open source projects.

Built with SvelteKit and TypeScript, prerendered and deployed to Cloudflare Workers. Every push to `master` deploys automatically through Workers Builds.

## Development

```sh
pnpm install
pnpm dev        # local dev server
pnpm check      # type-check
pnpm build      # production build
pnpm deploy     # build and deploy with wrangler
```

## Where things live

- `src/lib/projects.ts`: the project write-ups (summary, the problem, what I built, the hard parts, what I learned).
- `src/lib/diagrams.ts`: the architecture diagrams, as plain data (nodes, edges and groups in SVG coordinates). `src/lib/components/ArchitectureDiagram.svelte` draws them and builds the "Read the diagram as text" version from the same data.
- `src/lib/site.ts`: the site URL, name and profile links used in page metadata.
- `src/routes/about/+page.svelte`: the About page.

## GitHub stats

Stars, forks and the last push date come from the public GitHub API. They're fetched at build time and baked into the pages, then refreshed in the browser at low priority and cached for 10 minutes per tab. Without a token the API allows 60 requests an hour per IP, so if a build gets rate-limited the stats are left out until the browser refresh fills them in. Counts of zero are hidden.

## Share preview images

The 1200×630 images in `static/og/` and `static/apple-touch-icon.png` are generated from the project data. After changing a project's name, tagline or tech list, regenerate them:

```sh
node scripts/og-images.mjs
```

It needs Node 22.18 or later and a local Chrome or Chromium (set `CHROME=/path/to/chrome` if it isn't found). If `pngquant` is installed, it compresses the images too.

## Headers

`_headers` in the repo root sets the security headers. The Cloudflare adapter merges it into the deployed `_headers` file.
