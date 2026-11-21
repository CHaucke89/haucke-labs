---
title: One guestbook, three frameworks
draft: true
date: 2026-11-20
description: I rebuilt this site's SvelteKit guestbook in Angular and React on the same API, and compared bundle size, boilerplate, state handling and build time.
tags: [SvelteKit, Angular, React, Cloudflare]
---

The [guestbook](/guestbook) on this site was written in SvelteKit. I rebuilt it twice, in Angular at [/guestbook/angular](/guestbook/angular) and in React at [/guestbook/react](/guestbook/react). All three versions read and write the same notes, so you can sign in one and see your note in the others.

Building the same small feature twice is a fair way to compare frameworks. The data, the API and the design stay the same, so the differences that show up come from the frameworks.

## The setup

All three versions use one backend: a SvelteKit server module on Cloudflare Workers that talks to a D1 (SQLite) database. Over that module there are two ways in:

- The **Svelte page** uses SvelteKit form actions. The page is rendered on the server, and the form works without JavaScript.
- The **Angular and React components** call a JSON API at `/api/guestbook` (`GET` to read, `POST` to sign, `DELETE` to remove), using the same session cookie.

The Angular app is built with Angular Elements, which wraps a component as a standard custom element, `<hl-guestbook>`. The SvelteKit page loads the Angular bundle and places that tag in the page, so the site's header, footer and theme stay the same. The component uses Shadow DOM, which keeps the site's CSS from leaking in. CSS custom properties still pass through Shadow DOM, so the orange accent and the light and dark themes work with no extra code.

React has no official counterpart to Angular Elements, so the React version defines its own custom element, `<hl-react-guestbook>`, in about 20 lines: when the element is added to the page it attaches a shadow root, puts the stylesheet in it and renders the React app there, and when it's removed it unmounts the app. The stylesheet is a copy of the Angular one, and Vite's `?inline` import turns it into a string for the shadow root.

## Bundle size

| | Raw | Gzipped |
| --- | --- | --- |
| Svelte guestbook page (beyond the shared site runtime) | ~11 kB | ~5 kB |
| Angular guestbook element (everything) | 166 kB | ~54 kB |
| React guestbook element (everything) | 224 kB | ~70 kB |

The gaps are mostly not about my code. Svelte compiles each component to plain DOM calls, and the SvelteKit runtime is already on the page for every other route, so the guestbook only adds its own code. The Angular bundle has to bring the whole Angular runtime with it: change detection, dependency injection, the HTTP client and Elements.

In a full Angular app the runtime cost is paid once and shared by every page, as SvelteKit's is here. Embedding one Angular widget in a site built with another framework is the worst case for Angular.

React is the largest of the three, which surprised me at first. Almost all of it is `react-dom`, the part that turns components into DOM updates and handles events, scheduling and the newer features such as form actions. React doesn't tree-shake much, because `react-dom` is one prebuilt bundle, so it ships whole whether a page uses a feature or not. Angular's compiler can drop the parts of its runtime a component doesn't use. Like Angular, React's cost is paid once in a full React app, so this is the worst case for React too.

## Boilerplate

The Svelte UI is one file: about 100 lines of script and markup, plus styles. The Angular version spreads the same work over `main.ts` (bootstrap and custom element registration), a component class, a template and a stylesheet, plus `angular.json`, a `tsconfig.json` and a `package.json` for the build.

The component code itself is close in size. Most of the extra lines are setup that a new project creates once.

React lands in between. The UI is one `.tsx` file of about 190 lines, with markup written as JSX next to the logic, plus a 25-line `main.tsx` for the custom element and a short `vite.config.ts`. JSX makes the markup longer than Svelte's: there's no `{#if}` or `{#each}`, so conditions are written as `&&` or ternaries and lists as `.map()`, and attributes use their DOM names (`className`, `htmlFor`, `dateTime`). It's all plain TypeScript, so there's no template language to learn, and the type checker sees the markup as well as the logic.

## State: runes, signals and hooks

This was the most interesting part. Svelte and Angular have both moved to fine-grained reactivity, and their code lines up almost one for one.

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

React takes a different route. It has no signals: a component is a function that runs again whenever its state changes, and React compares the result with the last one to work out what to update. The same three values look like this:

```tsx
const [draft, setDraft] = useState(mine?.message ?? '');
const length = [...draft].length;
const [status, dispatch, saving] = useActionState(save, null);
```

`length` needs no special primitive, because the function body runs again on every render and recomputes it. The catch is the draft. `useState` only uses its starting value on the first render, so the draft won't follow the saved note when the data reloads. There's no `linkedSignal` or writable `$derived` in React. The usual answer is to move the form into its own component and give it a `key` that changes when the saved note changes:

```tsx
<NoteForm key={state.mine?.updatedAt ?? 'new'} mine={state.mine} ... />
```

A new key makes React throw the old form away and build a fresh one, which starts again from the saved note. It works and it's a well known pattern, but it's less direct than the other two, and you need to know the trick.

`useActionState` is React 19's answer to the saving state. It wraps an async function, gives back the latest result and a pending flag, and can be passed straight to a form's `action`, so the form needs no submit handler and no manual `saving` state. That lines up closely with SvelteKit's `use:enhance`. React has no built-in equivalent of `httpResource` for loading, so the first load is a `useEffect` that calls `fetch`; a bigger app would use a data library such as TanStack Query.

The Angular app also runs without zone.js. Since Angular 21, signals tell Angular what changed, rather than it checking the whole tree after every event, which brings it close to how Svelte updates the page.

## Build time

| | Time |
| --- | --- |
| `ng build` (Angular element alone) | ~2 s |
| `vite build` (React element alone) | ~0.15 s |
| `tsc --noEmit` (type-checking the React element) | ~1.5 s |
| `vite build` (the whole site, including prerendering) | ~9 s |

All three use fast tools underneath (esbuild for Angular, Vite and Rolldown for SvelteKit and React), and none is slow at this size. The React build is the fastest because Vite only strips the types and bundles; it doesn't check them, so the build runs `tsc` first. Angular's compiler checks types and templates as part of the build. The Angular and React builds are separate steps that run before the site build and write their output into `static/`.

## What I took away

- For a small embedded feature, Svelte is far lighter, because there is no runtime to ship. React is the heaviest.
- Angular's structure costs more files, but each one has a clear job, and that should pay off on a large team. React sits in between: one file for the UI, but with JSX's longer markup.
- Runes and signals are now close in what they do. React's re-render model is the odd one out: derived values are free, but state that follows other state needs a workaround like the `key` reset.
- One shared API made the comparison fair. Adding React only took a new frontend and a new page; the server didn't change.
