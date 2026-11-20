---
title: One guestbook, two frameworks
draft: true
date: 2026-11-20
description: I rebuilt this site's SvelteKit guestbook as an Angular web component on the same API, and compared bundle size, boilerplate, state handling and build time.
tags: [SvelteKit, Angular, Cloudflare]
---

The [guestbook](/guestbook) on this site was written in SvelteKit. I rebuilt it in Angular, and it's live at [/guestbook/angular](/guestbook/angular). Both versions read and write the same notes, so you can sign in one and see your note in the other.

Building the same small feature twice is a fair way to compare frameworks. The data, the API and the design stay the same, so the differences that show up come from the frameworks.

## The setup

Both versions use one backend: a SvelteKit server module on Cloudflare Workers that talks to a D1 (SQLite) database. Over that module there are two ways in:

- The **Svelte page** uses SvelteKit form actions. The page is rendered on the server, and the form works without JavaScript.
- The **Angular component** calls a JSON API at `/api/guestbook` (`GET` to read, `POST` to sign, `DELETE` to remove), using the same session cookie.

The Angular app is built with Angular Elements, which wraps a component as a standard custom element, `<hl-guestbook>`. The SvelteKit page loads the Angular bundle and places that tag in the page, so the site's header, footer and theme stay the same. The component uses Shadow DOM, which keeps the site's CSS from leaking in. CSS custom properties still pass through Shadow DOM, so the orange accent and the light and dark themes work with no extra code.

## Bundle size

| | Raw | Gzipped |
| --- | --- | --- |
| Svelte guestbook page (beyond the shared site runtime) | ~11 kB | ~5 kB |
| Angular guestbook element (everything) | 166 kB | ~54 kB |

That gap is mostly not about my code. Svelte compiles each component to plain DOM calls, and the SvelteKit runtime is already on the page for every other route, so the guestbook only adds its own code. The Angular bundle has to bring the whole Angular runtime with it: change detection, dependency injection, the HTTP client and Elements.

In a full Angular app the runtime cost is paid once and shared by every page, as SvelteKit's is here. Embedding one Angular widget in a site built with another framework is the worst case for Angular.

## Boilerplate

The Svelte UI is one file: about 100 lines of script and markup, plus styles. The Angular version spreads the same work over `main.ts` (bootstrap and custom element registration), a component class, a template and a stylesheet, plus `angular.json`, a `tsconfig.json` and a `package.json` for the build.

The component code itself is close in size. Most of the extra lines are setup that a new project creates once.

## State: runes and signals

This was the most interesting part. Both frameworks have moved to fine-grained reactivity, and the code lines up almost one for one.

The draft note needs to start as your saved note, follow it when the data reloads, and still let you type over it. Svelte does this with a writable `$derived`:

```ts
let draft = $derived(data.mine?.message ?? '');
let length = $derived([...draft].length);
let saving = $state(false);
```

Angular has a dedicated primitive for the same idea, `linkedSignal`:

```ts
protected readonly state = httpResource<GuestbookState>(() => '/api/guestbook');
protected readonly draft = linkedSignal(() => this.state.value()?.mine?.message ?? '');
protected readonly length = computed(() => [...this.draft()].length);
protected readonly saving = signal(false);
```

The difference is in the syntax. Svelte's runes are compiler hints, so `draft` reads and writes like a normal variable. Angular's signals are functions: you read with `draft()` and write with `draft.set(...)`. Svelte's code is shorter. Angular makes every reactive read visible in the code, which some people find easier to follow in a large codebase.

`httpResource` is also worth a mention. It wraps a request in signals (`value()`, `isLoading()`, `error()`, `reload()`), so loading and error states need no extra code. SvelteKit gets the same result differently, by loading the data on the server before the page renders.

The Angular app also runs without zone.js. Since Angular 21, signals tell Angular what changed, rather than it checking the whole tree after every event, which brings it close to how Svelte updates the page.

## Build time

| | Time |
| --- | --- |
| `ng build` (Angular element alone) | ~2 s |
| `vite build` (the whole site, including prerendering) | ~9 s |

Both use fast tools underneath (esbuild for Angular, Vite and Rolldown for SvelteKit), and neither is slow at this size. The Angular build is a separate step that runs before the site build and writes its output into `static/`.

## What I took away

- For a small embedded feature, Svelte is far lighter, because there is no runtime to ship.
- Angular's structure costs more files, but each one has a clear job, and that should pay off on a large team.
- Runes and signals are now close in what they do. Picking between the frameworks is more about bundle cost and project shape than about how state works.
- One shared API made the comparison fair, and it means a third version in another framework would only need a new frontend.
