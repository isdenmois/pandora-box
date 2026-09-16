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

## Client conventions

- API calls go through `client/shared/api/*` (wretch wrapper in `http.ts`); 401/403 globally clear the auth state.
- `VITE_SEARCH_URL` is a build-time env used for external search links.
- UnoCSS with presetWind4; custom breakpoint `zf: 380px` defined in `vite.config.ts`.

## Deployment

`docker-compose.yml` runs two services: `api` (Bun, SQLite volume at `/data`) and `webapp` (nginx serving `dist/`, proxying `/api/` to the api service via `client/nginx.conf` template with `$PORT`/`$API_SERVER`). Client image needs the `VITE_SEARCH_URL` build arg.
