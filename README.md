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
- `src/lib/lab.ts`, `src/routes/lab/`, `src/routes/api/lab/`: the live lab dashboard (see below).

## GitHub stats

Stars, forks and the last push date come from the public GitHub API. They're fetched at build time and baked into the pages, then refreshed in the browser at low priority and cached for 10 minutes per tab. Without a token the API allows 60 requests an hour per IP, so if a build gets rate-limited the stats are left out until the browser refresh fills them in. Counts of zero are hidden.

## Live lab dashboard (`/lab`)

`/lab` is the one page rendered per request instead of prerendered. Home Assistant pushes a snapshot to `POST /api/lab`, the Worker validates it and stores it under one key in the `LAB` KV namespace, and `/lab` reads it back. Only readings listed in the snapshot are ever public, so Home Assistant decides exactly what is shared.

One-time setup:

```sh
openssl rand -hex 32                     # generate a token
pnpm exec wrangler secret put LAB_INGEST_TOKEN
```

The KV namespace is created automatically on the first `wrangler deploy`. For local development, copy `.dev.vars.example` to `.dev.vars`; `pnpm dev` emulates KV locally.

Home Assistant config (`configuration.yaml`), with the token in `secrets.yaml` as `lab_ingest_auth: "Bearer <token>"`:

```yaml
rest_command:
  push_lab_snapshot:
    url: https://hauckelabs.dev/api/lab
    method: POST
    headers:
      Authorization: !secret lab_ingest_auth
    content_type: application/json
    payload: >
      {"readings": [
        {"id": "office_temp", "label": "Office", "group": "Climate",
         "value": {{ states('sensor.office_temperature') | float(0) }}, "unit": "°F"},
        {"id": "printer", "label": "Printer", "group": "3D printer",
         "value": "{{ states('sensor.printer_status') }}"}
      ]}

automation:
  - alias: Push lab snapshot
    trigger:
      - platform: time_pattern
        minutes: /5
    action:
      - service: rest_command.push_lab_snapshot
```

Each reading is `{ id, label, value, unit?, group? }`; up to 40 are kept, and anything malformed is dropped. Test it locally with:

```sh
curl -X POST localhost:5173/api/lab -H "Authorization: Bearer dev-token-change-me" \
  -H "Content-Type: application/json" \
  -d '{"readings":[{"id":"t","label":"Office","value":71.2,"unit":"°F","group":"Climate"}]}'
```

`pnpm cf-typegen` adds a `GlobalProps.mainModule` line pointing into `.svelte-kit/` when a build exists. Delete it, or `pnpm check` will type-check the build output.

### Printer camera

`/lab` can show the 3D printer's camera (mjpg-streamer). The browser only ever talks to `/lab/camera`; the Worker fetches the camera through a Cloudflare Tunnel, presenting an Access service token, and streams the response back. The camera hostname and token never reach the page, and the camera stays behind Access for everyone else.

- `GET /lab/camera` returns one JPEG (`?action=snapshot`). The page refreshes it every 5 seconds.
- `GET /lab/camera?live` streams MJPEG (`?action=stream`). The page stops it after 2 minutes or when the tab is hidden.

One-time setup:

1. **Tunnel**: add a public hostname (`printer.hauckelabs.dev`) to the existing tunnel, with service `http://<printer LAN IP>:8080`.
2. **Service token**: Zero Trust → Access → Service credentials → create a token. Copy the client ID and secret.
3. **Access policy**: on the Access application for that hostname, add a policy with action *Service Auth* that includes the token.
4. **Worker secrets**:

   ```sh
   pnpm exec wrangler secret put CAMERA_URL                  # https://printer.hauckelabs.dev/
   pnpm exec wrangler secret put CAMERA_ACCESS_CLIENT_ID
   pnpm exec wrangler secret put CAMERA_ACCESS_CLIENT_SECRET
   ```

Without `CAMERA_URL` (previews, local dev by default) the camera is hidden. Check the token from a shell with:

```sh
curl -sI "https://printer.hauckelabs.dev/?action=snapshot" \
  -H "CF-Access-Client-Id: <id>" -H "CF-Access-Client-Secret: <secret>"
```

A `200` with `content-type: image/jpeg` means the Worker will get through; a `302` to `cloudflareaccess.com` means the policy doesn't include the token.

## Share preview images

The 1200×630 images in `static/og/` and `static/apple-touch-icon.png` are generated from the project data. After changing a project's name, tagline or tech list, regenerate them:

```sh
node scripts/og-images.mjs
```

It needs Node 22.18 or later and a local Chrome or Chromium (set `CHROME=/path/to/chrome` if it isn't found). If `pngquant` is installed, it compresses the images too.

## Headers

`_headers` in the repo root sets the security headers. The Cloudflare adapter merges it into the deployed `_headers` file.
