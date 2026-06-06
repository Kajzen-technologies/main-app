# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Prague Blackout Resilience App — offline-first crisis portal (maps, status reports, guides, emergency AI advisor). pnpm workspace monorepo, TypeScript end-to-end.

## Repository state — read this before trusting other docs

`README.md`, `tree.txt`, and `docs/architecture.md` describe an aspirational four-app monorepo (web, admin, mobile, api) backed by PostgreSQL + PostGIS via Prisma. **The current working tree is narrower:**

- Only `apps/web` exists. `apps/admin/` and `apps/mobile/` have been deleted (visible as `D` entries in `git status`). The old `Frontend/` directory is also gone.
- There is **no real database**. `services/api/src/modules/database/prisma.ts` is a hand-rolled mock that implements a subset of the `PrismaClient` interface over a JSON file at `services/api/db.json`. It is auto-seeded on first start and exported as `prisma` (cast to `PrismaClient`) so the rest of the codebase can keep calling `prisma.marker.findMany(...)` etc. unchanged.
- The `prisma/` directory and `@prisma/client` dependency are still present but unused at runtime. `docker-compose.yml` and `pnpm docker:up` are likewise not needed for local dev.
- To wipe data, delete `services/api/db.json` and restart the API — it will re-seed.
- `tree.txt` is stale (still shows admin/mobile/prisma). Don't rely on it as a structural reference; use `git ls-files` or actually look.

If you need to bring admin/mobile back, recover them from git history rather than starting from `tree.txt`.

## Commands

Run from repo root unless stated otherwise.

```bash
pnpm install                        # install workspace deps
pnpm --filter shared dev            # tsc -w on packages/shared — run alongside other dev procs
pnpm dev:api                        # Express API on :12360 (ts-node-dev, hot reload, auto-seeds db.json)
pnpm dev:web                        # Next.js web on :12359 (Fast Refresh, binds 0.0.0.0)

pnpm build:shared                   # tsc build of packages/shared → dist/
pnpm build:web                      # next build
pnpm --filter api build             # tsc build of services/api → dist/
```

There are **no test, lint, or typecheck scripts wired up** at any workspace level. The only typecheck path today is via `tsc` during builds.

Stale scripts in root `package.json` (`dev:admin`, `dev:mobile`, `build:admin`, `db:migrate`, `db:seed`, `db:studio`, `docker:up`) reference deleted workspaces or unused tooling and will fail. Do not run them without first recreating what they depend on.

## Architecture

### Workspaces

- `services/api` — Express + TypeScript. Entry: `src/main.ts`. Modules under `src/modules/{admin-auth,markers,reports,guides,analytics,database}/` follow a controller/service/repository split. Controllers export `Router` instances mounted in `main.ts`.
- `apps/web` — Next.js 14 App Router. Leaflet + react-leaflet for maps. Has offline features in `src/features/offline/` (queue + storage + sync) and local-only user profile in `src/features/profile/`. Translations live in `src/lib/translations/{cs,en}.ts`.
- `packages/shared` — Cross-cutting types and pure logic: marker/guide/profile types and Zod validation, category constants and labels, search normalization (diacritics-stripping), Haversine distance, marker sort priority, anonymous user helpers. Consumed via `"shared": "workspace:*"`. Build output: `dist/index.{js,d.ts}`.

### Env loading (non-obvious)

`services/api/src/main.ts` loads env from **two locations in order**: root `/.env` first, then `services/api/.env`. The later file overrides the earlier one. Both files currently exist with overlapping keys, so editing the wrong one silently changes nothing. The root `.env` is generally the source of truth; service-level `.env` exists mostly for the `PORT=12360` override that bumps the API off the documented `3001`.

Web/admin/mobile use `NEXT_PUBLIC_API_BASE_URL` / `EXPO_PUBLIC_API_BASE_URL`. Default is `http://localhost:12360` (not `:3001`, despite what `docs/api.md` and the README say).

### AI advisor key routing

`POST /ai/chat` picks a provider based on key prefix in `ANTHROPIC_API_KEY` (falling back to `GEMINI_API_KEY`):

- `sk-or-v1-…` → OpenRouter (Claude 3.5 Haiku via OpenRouter)
- `sk-…` (other) → Anthropic Messages API directly
- otherwise, if `GEMINI_API_KEY` is a real key → Gemini 1.5 Flash
- otherwise → deterministic Czech/English keyword-matched mock in `getMockAiResponse()` inside `main.ts`

The env var named `ANTHROPIC_API_KEY` may legitimately hold an OpenRouter key (`sk-or-v1-...`). Don't "fix" that by routing it elsewhere — the prefix detection is intentional.

### In-memory state in the API

`main.ts` keeps `sosSignals`, `feedMessages` (ZPRÁVY tab), and `meshStatus` in plain module-level variables. They reset on restart and are not in `db.json`. Don't move them to the JSON store without checking why they were kept ephemeral.

### Marker/guide domain

- Marker categories, priority ordering, and labels are centralized in `packages/shared/src/markers/` — modify category enums there, not in the API or web app.
- `Marker.verificationStatus` (`PENDING` | `APPROVED` | `REJECTED` | `NEEDS_REVIEW`) gates public visibility. Public `GET /markers` returns only `APPROVED`. The admin flow lives under `/admin/markers/*` routes and was the home of the now-deleted admin panel.
- Reports auto-flag markers as `NEEDS_REVIEW` via logic in `services/api/src/modules/reports/needs-review.service.ts`.

### Offline-first web

Web app stores anonymous user identity (`localUserId`), profile data, and a pending-actions queue in `localStorage`. `syncOfflineActions.ts` drains the queue when connectivity returns. Server endpoints accept `localUserId` in bodies to attribute reports without auth.

## Conventions

- TypeScript everywhere, `^5.3.3`.
- API code uses CommonJS-style imports (`ts-node-dev` runs `src/main.ts` directly). Web uses Next.js ESM.
- API responses are bilingual when user-facing: typically `{ message, messageEn, ... }`. Preserve that pattern when adding endpoints that return human-readable strings.
- User-facing strings in the web app go through `src/lib/translations/{cs,en}.ts`. Czech is the primary language.

## Design tokens / theming

Brand palette is the City of Prague flag — red `#DA1F26`, yellow `#FCC800`. **Do not introduce raw hex or `rgba()` literals into web code.** Use the token system already in place:

- `apps/web/src/app/globals.css` defines every token under `:root` (dark default) with `:root[data-theme="light"]` overrides. The legacy `body.light-theme` class selector is still wired so older code paths keep working.
- `apps/web/src/lib/theme/tokens.ts` mirrors the brand + category palette as TS constants. Use these **only** where `var()` can't reach: SVG presentation attributes (`stroke="..."`, `fill="..."`), Leaflet `divIcon` HTML strings, canvas APIs. Inline `style={{ stroke: 'var(--x)' }}` works everywhere else — prefer it.
- `apps/web/src/lib/theme/ThemeProvider.tsx` reads/writes `localStorage` (`praha-odolna:theme`), honors `prefers-color-scheme`, and sets `data-theme` on `<html>`. `themeInitScript` is injected in `layout.tsx` as a pre-paint inline script to prevent flash.
- `ThemeToggle` from the same directory cycles dark → light → system.

Token families (semantic names — use these, not the raw values):

- **Brand**: `--color-primary` (Prague red), `--color-accent` (Prague yellow), `--color-primary-hover`, `--color-primary-soft`, `--color-primary-glow`, `--text-on-brand`, `--text-on-accent`.
- **Semantic intent**: `--color-success` / `--color-warning` / `--color-danger` / `--color-info` — each has a matching `-rgb`, `-soft`, `-glow` companion. `--color-danger` is intentionally **distinct from `--color-primary`** so delete buttons don't visually collide with primary actions; both are red-family but different hues.
- **Surfaces**: `--bg-canvas` (body), `--bg-primary` / `--bg-secondary` (Apple-system tiers), `--bg-surface`, `--bg-surface-elevated`, `--bg-glass`, `--bg-sidebar`, `--bg-modal`.
- **Text**: `--text-primary` / `--text-secondary` / `--text-tertiary`, plus `--text-inverse`, `--text-on-brand` (yellow on red), `--text-on-accent` (red on yellow). Legacy aliases `--text-main` / `--text-muted` map onto the same values.
- **Inverting "ink" triplets** for theme-aware overlays/borders: `rgba(var(--rgb-overlay), 0.08)` is white-on-dark or black-on-light depending on theme. Use these instead of hard-coded `rgba(255,255,255,X)` or `rgba(0,0,0,X)` whenever the value is meant to *blend* with the surface. Always-black scrims (shadows, modal backdrops) use `var(--rgb-scrim)` which doesn't flip.
- **Inverting surface triplets**: `var(--rgb-surface-glass)`, `--rgb-surface-elevated`, `--rgb-surface-deep`, `--rgb-surface-sidebar`, `--rgb-surface-chip`. Use when you need a translucent surface with a custom alpha that should flip dark→light.
- **Badges** (`--badge-{alert,mesh,supply,infra,info}-{fg,bg,border}`) — `services/api/src/main.ts` returns these `var(...)` strings inline in the `feedMessages` payload. The client renders them via `style={{ background: msg.badgeBg }}` and the browser resolves the var. If you add a new badge type, define its tokens in `globals.css` first and emit the token string from the API.
- **Categories** (`--cat-hospital`, `--cat-pharmacy`, `--cat-gas-station`, `--cat-police`, `--cat-fire`, `--cat-supermarket`, `--cat-transport`, `--cat-district-office`, `--cat-community`, `--cat-school`, `--cat-elderly`, `--cat-emergency-point`) — identity-stable, **do not theme**. Mirror values live in `CATEGORY_COLORS` in `tokens.ts` for any place that needs a hex literal.

The `apple-place-circle` class hard-codes `color: #FFFFFF` so glyph icons inside category-coloured circles stay readable in both themes regardless of the theme's text color.

`SVG` and `lucide-react` icons that need a CSS-var colour must use inline `style={{ stroke: 'var(--x)' }}` — `stroke="var(--x)"` as an attribute does NOT resolve in any browser (it's not a valid SVG paint value). For `lucide-react` icons, set the parent's `color` and pass `color="currentColor"` to the icon.

## Docs to trust vs. distrust

- Trust: `docs/local-development.md` (matches reality on DB and ports).
- Distrust without verification: `README.md`, `tree.txt`, `docs/architecture.md`, `docs/api.md`, `docs/database.md`. These describe the PostgreSQL/multi-app design and pre-port-change setup. Useful as intent, misleading as current state.
