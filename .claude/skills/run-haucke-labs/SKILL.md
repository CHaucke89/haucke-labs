---
name: run-haucke-labs
description: Build, run, and drive the hauckelabs.dev SvelteKit site locally. Use when asked to start the dev server, run pnpm check or build, push test readings to /lab, sign in to the guestbook, test the Angular or React guestbook, or screenshot any page.
---

Start the Vite dev server (it emulates KV, D1 and secrets locally), then drive it with `.claude/skills/run-haucke-labs/driver.mjs`, a headless Chromium REPL that reads one command per line on stdin. Paths are relative to the repo root.

## Setup

Node 22 and pnpm 10 (from `packageManager`). The driver needs the `playwright` package with Chromium; it isn't a project dependency, so it is loaded from `NODE_PATH` (Claude Code cloud containers have it there already).

```bash
pnpm install --frozen-lockfile
cp .dev.vars.example .dev.vars          # skip if you already have one
sed -i "s/^SESSION_SECRET=$/SESSION_SECRET=$(openssl rand -hex 32)/" .dev.vars
pnpm exec wrangler d1 migrations apply haucke-labs --local
pnpm build:react && pnpm build:angular  # only needed for /guestbook/react and /guestbook/angular
```

## Run (agent path)

```bash
pnpm dev > /tmp/haucke-labs-dev.log 2>&1 &
timeout 60 bash -c 'until curl -sf -o /dev/null http://localhost:5173/; do sleep 1; done'

node .claude/skills/run-haucke-labs/driver.mjs <<'EOF'
push-lab
nav /lab
wait-for text=Progress
screenshot lab
login Agent
nav /guestbook
wait-for textarea#message
fill textarea#message Hello from the run-haucke-labs driver
click button[type=submit]:not(.secondary)
wait-for text=Saved. Thanks!
screenshot guestbook
nav /guestbook/react
wait-for hl-react-guestbook >> text=Hello from the run-haucke-labs driver
screenshot react
console
EOF
```

Screenshots land in `/tmp/haucke-labs-shots/` (override with `SHOT_DIR`). Point at another server with `--base http://localhost:8787`. The exit code is 1 if any command failed.

| command | what it does |
|---|---|
| `nav <path>` | go to a path (or full URL), prints status |
| `wait-for <sel>` | wait up to 30 s; `text=Foo` matches text, `a >> b` chains into shadow DOM |
| `click <sel>` / `fill <sel> <text>` / `press <key>` | interact |
| `text [sel]` | print innerText (default `main`) |
| `eval <js>` | run JS in the page, prints JSON |
| `screenshot [name]` | full-page PNG |
| `login [name]` | sets a signed `session` cookie (fake GitHub user) using `SESSION_SECRET` from `.dev.vars` |
| `logout` | clears cookies |
| `push-lab [json]` | POSTs readings to `/api/lab` with `LAB_INGEST_TOKEN`; default is 3 sample readings |
| `console` | browser console errors since the last call |

Stop: `lsof -ti:5173 -sTCP:LISTEN | xargs -r kill`

For API-only checks, `curl` is enough:

```bash
curl -s -X POST localhost:5173/api/lab -H "Authorization: Bearer dev-token-change-me" \
  -H "Content-Type: application/json" \
  -d '{"readings":[{"id":"t","label":"Office","value":21.5,"unit":"°C","group":"Climate"}]}'
# {"ok":true,"stored":1}
```

## Production build, served by the Worker runtime

```bash
pnpm check   # 0 errors, ~8 s
pnpm build   # guestbooks + site, ~11 s
pnpm exec wrangler dev --port 8787 > /tmp/haucke-labs-wrangler.log 2>&1 &
timeout 90 bash -c 'until curl -sf -o /dev/null http://localhost:8787/; do sleep 1; done'
node .claude/skills/run-haucke-labs/driver.mjs --base http://localhost:8787 <<'EOF'
push-lab
nav /lab
wait-for text=Progress
screenshot preview-lab
EOF
lsof -ti:8787 -sTCP:LISTEN | xargs -r kill
```

There is no unit test suite. CI runs `pnpm check` and `pnpm build`.

## Gotchas

- **Edits to `.dev.vars` need a dev server restart.** Secrets are read at startup; `login` silently does nothing (page still says "Sign in") until you restart.
- **`login` needs a non-empty `SESSION_SECRET`.** The example file leaves it blank, and `readSession` then ignores every cookie.
- **`/lab` shows °F by default** and converts °C readings (21.4 °C shows as 70.5). Don't assert on the raw value.
- **Vite dev and `wrangler dev` share `.wrangler/state`**, so lab readings and guestbook notes carry over between them.
- **Guestbook rate limit:** a note can be edited once a minute. A second save inside that window shows the cooldown error, not "Saved".
- **The Angular and React guestbooks render in shadow roots.** Use `hl-guestbook >> text=...` or `hl-react-guestbook >> ...`.
- **`/ask` answers 503 locally** unless `ANTHROPIC_API_KEY` is in `.dev.vars`; the page itself still renders. Leave it unset to avoid spending real tokens.
- **`/lab/camera` is 404** when `CAMERA_URL` is empty, and the camera card is hidden. That's expected.
- **Never point `push-lab` at hauckelabs.dev.** The real `/lab` is public, and KV writes there count against the free plan's daily limit.

## Troubleshooting

- **`/guestbook` or `/api/guestbook` returns 500, log says `D1_ERROR: no such table: guestbook`**: run `pnpm exec wrangler d1 migrations apply haucke-labs --local`.
- **`wait-for hl-react-guestbook` times out, console shows a 404**: `static/react-guestbook/main.js` isn't built. Run `pnpm build:react` (or `build:angular` for `/guestbook/angular`).
- **`wrangler dev` logs `Unable to fetch the Request.cf object` and `Request was cancelled`**: it can't reach workers.cloudflare.com (sandboxed network). Harmless; the server still starts.
- **`Cannot find module 'playwright'`**: the driver is ESM, which ignores `NODE_PATH` for imports; it falls back to `require` via `NODE_PATH`. Install playwright globally or set `NODE_PATH` to the global `node_modules`.
