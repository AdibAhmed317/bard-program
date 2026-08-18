# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Event site for "Teachers Development Training 2026 — IIUC × BARD". Two audiences:

- **Public** — a long single-page programme (`/`) and a `/lookup` page where a participant enters their Teacher ID + phone to see their room, group leader, attendance, schedule and group links.
- **Admin** (`/admin/*`) — CRUD for participants, rooms, sessions (+ per-session resources), group links, attendance marking, admin users, and Excel export/import.

TanStack Start (SSR, file-based routing) + Drizzle/Postgres (Supabase) + better-auth, deployed on Netlify.

## Commands

```bash
npm run dev              # vite dev on :3000
npm run build            # vite build -> dist/client (Netlify publish dir)
npm run generate-routes  # tsr generate — regenerate src/routeTree.gen.ts by hand
npx tsc --noEmit         # only typecheck available; there is no linter, formatter or test suite

npm run db:generate      # drizzle-kit generate — SQL migration from schema.ts into drizzle/
npm run db:migrate       # apply migrations
npm run db:push          # push schema straight to the DB (used during iteration)
npm run db:studio

npm run admin:create -- <username> <password> [name]   # seed an admin account
```

`routeTree.gen.ts` is generated and marked read-only in `.vscode/settings.json` — never hand-edit it; the Vite plugin regenerates it on dev/build.

Env vars (`.env`, also read from `.env.local`): `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`. Both `bun.lock` and `package-lock.json` are committed; scripts are written for npm.

## Architecture

**Server functions, not API routes.** Every data operation is a `createServerFn` in `src/lib/*-api.ts`, imported directly into route loaders and components. The only real HTTP route is [src/routes/api/auth/$.ts](src/routes/api/auth/$.ts), which hands GET/POST to better-auth.

- [src/lib/admin-api.ts](src/lib/admin-api.ts) — rooms, participants (incl. `bulkImportParticipants`), attendance; also exports `TRAINING_DAYS`, the hardcoded list of programme days that both admin and public views key off.
- [src/lib/sessions-api.ts](src/lib/sessions-api.ts) — schedule sessions + `sessionResources` (`slide | file | link`).
- [src/lib/links-api.ts](src/lib/links-api.ts), [src/lib/users-api.ts](src/lib/users-api.ts) (wraps better-auth's admin plugin API), [src/lib/public-api.ts](src/lib/public-api.ts) (`lookupParticipant` — the one unauthenticated server fn).

**Auth is two-layered, both defined in [src/lib/session.ts](src/lib/session.ts):**

- `requireAdminRoute()` runs in `beforeLoad` and redirects to `/admin/login`. It is mounted **once** on the pathless layout route [src/routes/admin/_shell.tsx](src/routes/admin/_shell.tsx), which also renders the sidebar so the chrome doesn't remount on navigation. Child pages live in `src/routes/admin/_shell/` and keep clean `/admin/*` URLs.
- `requireAdminHandler()` must be called at the top of **every** admin server fn handler — route guards protect the page, not the RPC endpoint. Any new admin server function needs this line.

Admins sign in by **username**, not email: better-auth's `username` plugin still stores an email internally, so accounts are created with a synthetic `<username>@admin.local`. Session state is cached in a signed cookie for 5 min (`cookieCache` in [src/lib/auth.ts](src/lib/auth.ts)) — without it every guard is a Postgres round trip on a serverless host.

**Mutations go through `useAction`** ([src/lib/use-action.ts](src/lib/use-action.ts)): wraps a server fn with pending/error state, calls `router.invalidate()` on success, and returns a discriminated `{ ok }` result (most handlers return void, so a bare `undefined` can't signal failure). Errors thrown in handlers surface as user-facing strings, so throw messages meant to be read.

**URLs stored in the DB** (session resources, group links) must pass `assertSafeUrl()` from [src/lib/safe-url.ts](src/lib/safe-url.ts) before insert — they're rendered as `href`s.

**Excel** — [src/lib/excel-export.ts](src/lib/excel-export.ts) builds styled workbooks with `exceljs` (participants sheet-per-department, attendance); participant *import* parses uploads with `xlsx` client-side in [participants.tsx](src/routes/admin/_shell/participants.tsx) then calls `bulkImportParticipants`.

## Data model notes ([src/db/schema.ts](src/db/schema.ts))

- better-auth tables (`user`/`session`/`account`/`verification`) mirror its core schema plus the `admin` and `username` plugin fields — column names must match exactly for the drizzle adapter, so change them only alongside a better-auth config change.
- `participants.idCardNo` is unique via a **partial** index (participants without an ID are allowed). `attendance` is unique on `(participantId, day)`.
- `day` columns are plain `text` holding `YYYY-MM-DD` values that must match `TRAINING_DAYS`.

## Conventions

- Imports use the `#/*` alias for `src/*` (`@/*` also maps there but `#/` is what the codebase uses). `.ts` extensions appear in some imports — `allowImportingTsExtensions` is on.
- Styling is Tailwind v4 with a custom "Editorial Bangladesh" palette (`--forest-*`, `--crimson-*`, `--brass-*`, `--ivory-*`, `--charcoal-*`) declared in [src/styles.css](src/styles.css) and mapped onto shadcn's semantic tokens. Use the palette variables rather than raw hexes or default Tailwind colors. Icons are `lucide-react`.
- shadcn/ui components: add with `pnpm dlx shadcn@latest add <component>` (per `.cursorrules`); config in `components.json` (new-york style, aliases already pointed at `#/`).
- List routes fetch independent queries with `Promise.all` in the loader and set `pendingComponent: AdminSkeleton`. Router defaults (preload on intent, stale times, pending delays) are tuned in [src/router.tsx](src/router.tsx).
- `vite.config.ts` deliberately pins `cacheDir` to the OS temp dir and pre-lists `optimizeDeps.include` — this works around Windows EPERM/"504 Outdated Optimize Dep" failures on the D: drive. Don't remove it.
- [AGENTS.md](AGENTS.md) lists TanStack "intent" guidance packs (`npx @tanstack/intent@latest load <id>`) covering Start server functions, middleware, router data loading, auth guards and deployment — load the matching one before non-trivial TanStack work.
