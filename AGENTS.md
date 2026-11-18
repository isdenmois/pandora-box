# AGENTS.md

Pandora Box — a personal media watchlist app (movies/series with tags, ratings, viewing history).

> `README.md` is stale Svelte-template boilerplate. Ignore it; this file is the source of truth.

## Stack & layout

Monorepo with two apps in one package (Bun-managed, `bun.lock`, exact versions via `bunfig.toml`):

- `client/` — Vue 3 SPA (Pinia, vue-router, UnoCSS presetWind4, wretch, valibot). Layered (FSD-style): `app/` → `pages/` → `features/` → `entities/` → `shared/`. Dependencies point downward only.
- `server/` — Bun + Elysia API. Layered: `views/` (HTTP controllers + Elysia `t.` contracts, auth guards) → `app/` (use-cases) → `domain/` (drizzle entities/schema, search-provider interface, session) ← `infra/` (db, env, repositories).
- `e2e/` — Playwright tests (`builders/`, `fixtures/`, `mocks/`, `page-objects/`, `tests/`).
- `drizzle/` — generated SQL migrations. `data/` — local SQLite db. `public/` — static assets.

## Commands

```sh
bun run dev          # vite dev server (client) on :5173, proxies /api → :3000
bun run server       # API server with --watch on :3000
npm run lint         # biome check .   (npm, not bun, for scripts)
npm run format       # biome check --write .
npm run test:client  # vitest --run (jsdom; client tests colocated in __tests__/ dirs)
npm run test:server  # vitest --run (node env; server tests)
npm run test:unit    # test:client + test:server
npm run test:pw      # playwright (chromium only; auto-starts dev server on :5173)
npm run test         # unit + pw  (manual full run)
npm run db:generate  # generate migration from schema  (needs DATABASE_URL)
npm run db:migrate   # apply migrations (also runs automatically on server start)
npm run db:studio    # drizzle studio
```

Git hooks are managed by lefthook (`lefthook.yml`, installed via the `prepare` script):

- pre-commit: `biome check --write` on staged files, fixes re-staged (`stage_fixed`).
- pre-push: `test:server`, `test:client`, `test:pw` as parallel jobs.

No `typecheck` script exists (no vue-tsc); TypeScript is checked by editors and bun's transpiler only.

## Path aliases & imports

- Client: `@/*` → `client/*`; **`@/server/*` → `server/domain/*`** — the client imports server domain types through this alias. Keep domain entities dependency-free so both sides can use them.
- Server (relative to `server/`): `@/domain`, `@/infra`, `@/views`, `@/app` (see `server/tsconfig.json`).
- Import order is enforced by Biome's `organizeImports` (`assist` in `biome.json`): `node:*`/bun, external, internal (`@/...` in FSD layer order: `@/app`, `@/features`, `@/entities`, `@/shared`), then relative. Alphabetized. Run `npm run lint` / `npm run format` before committing — the pre-commit hook fixes and re-stages staged files.

## Server conventions

- Routes are Elysia plugins under `/api` (see `server/views/http/index.ts`); request/response validation via Elysia `t.` contracts in `*.contract.ts` files.
- Env vars are valibot-parsed at import time in `server/infra/env` — the server throws without `DATABASE_URL` and `OMDB_URL`.
- Drizzle schema lives in `server/domain/entities/`; after changing it run `npm run db:generate` and commit the migration in `drizzle/`. Migrations apply automatically on server boot.
- Search is backed by external OMDB (`OMDB_URL`) behind the `SearchProvider` interface (`server/domain/search-provider`, impl in `server/infra/repositories/search-repository/search-providers`).

### Posters

Posters are stored locally and served from `/images/`.

- **DB split:** `poster` holds the public path (`/images/<id>.<ext>`), `posterSource` holds the original remote URL. Create/update requests still send the *remote* URL in `poster`; the repository maps it via `posterFieldsFor`/`posterUpdateFor` (`server/infra/repositories/poster-fields.ts`). Changing `posterSource` unlinks the stale file, so switching source re-downloads. Replaying an **unchanged** source is a no-op: the stored path is the corrected one (`<id>.png` for a URL without an extension, say) and re-guessing it would point the row at a file that was never written.
- **Manual upload.** The edit form sends the record fields and a picked file in one request: `PATCH /api/v1/movie/:id/poster` (series mirrors it), multipart with a JSON `data` part validated against the same patch contract and a `file` part. The extension comes from the bytes (`file-type`), never from the file name or the declared MIME; the image allowlist, end-marker check and `IMAGE_MAX_BYTES` cap match the downloader. The row gets the local path and `posterSource` becomes `null` — a manual poster has no origin to re-download from. URL-only saves keep using the JSON `PATCH`.
- **No eager downloads.** Files are fetched lazily on the first request for the path. nginx serves hits straight from the mounted volume and proxies misses to `/images/:fileName` (`server/views/http/image/`), which downloads, stores and serves them in one response. A miss without a valid session (or with a remembered failure) redirects `302` to `posterSource` with `no-store`. `DELETE /api/v1/poster/:id` drops the file and keeps the path, so the next view downloads again; it answers `409` when the row has no source (a manual poster owns its only copy).
- **Files:** flat `IMAGE_DIR/<recordId>.<ext>`, written to a unique `<id>.<ext>.<uuid>.tmp` name and renamed into place, so two requests for one cold miss cannot clobber each other. Extension comes from the response content type, and the row is patched if it differs from the guessed one.
- **Guardrails** (`poster-fetcher.ts`): http(s) only, private/loopback addresses rejected on every redirect hop, image content-type allowlist, `IMAGE_MAX_BYTES` cap enforced while streaming, 4 s per attempt / 10 s total, 3 attempts with backoff, and `Content-Length` plus JPEG/PNG end-marker checks (a truncated JPEG still decodes, so decoding is not a sufficient check). Concurrent requests for one URL are deduped and capped at 3 in flight; a failure is remembered for 10 minutes. Addresses are resolved once for the check and again by `fetch`, so a rebinding host can still slip through — accepted, since planting a poster URL already needs an authenticated write.
- `IMAGE_FETCH=off` disables downloads entirely. `DELETE /api/v1/admin/images/orphans` removes files no row references and returns the count. It also sweeps `.tmp` files older than 10 minutes (a fresh one belongs to a save in flight) and every `.jpeg`, which no code path writes since `jpeg` is normalized to `jpg`.
- **Reads are unauthenticated** — `/images/<id>.<ext>` needs no session, including posters of `private` records. That is the trade for nginx answering hits from disk.
- **Backups are DB-only** (`/api/v1/admin/backup`), so a restore on another machine re-downloads each poster on first view. Restoring localizes rows from a backup taken before the column split, where `poster` still held the remote URL.

## Client conventions

- API calls go through `client/shared/api/*` (wretch wrapper in `http.ts`); 401/403 globally clear the auth state.
- `VITE_SEARCH_URL` is a build-time env used for external search links.
- `client/shared/lib/poster.ts` mirrors the server's `IMAGE_MAX_BYTES` default for the upload pre-check; the server contract enforces the real cap.
- UnoCSS with presetWind4; custom breakpoint `zf: 380px` defined in `vite.config.ts`.

## Deployment

`docker-compose.yml` runs two services: `api` (Bun, SQLite volume at `/data`, posters at `/data/images` via `IMAGE_DIR`) and `webapp` (nginx serving `dist/`, proxying `/api/` to the api service via `client/nginx.conf` template with `$PORT`/`$API_SERVER`). The webapp also mounts `./data/images` read-only at `/usr/share/nginx/html/images`, so nginx answers poster hits itself. Client image needs the `VITE_SEARCH_URL` build arg.

Local posters live in `data/images/`, which is gitignored and excluded from the Docker build context (`data/` in `.dockerignore`).
