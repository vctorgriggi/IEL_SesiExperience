# Agents

Context for AI coding agents working on this monorepo.

## Project Overview

Arki is a SaaS starter kit built as a Turborepo monorepo with Bun.

**Language**: User-facing error messages, UI strings, and code comments use **Portuguese**. Docs for agents and IDEs (this file, `CLAUDE.md`, `.cursor/rules`) use **English**.

## Monorepo Map

| Path | What it does | Tech |
|---|---|---|
| `apps/dashboard` | Main web application + API (auth, CRUD, webhooks via Route Handlers in `app/api/`) and the IEL prototype under `/iel` | Next.js 15, React 19 |
| `packages/auth` | Authentication logic (Auth.js/next-auth, sessions, TOTP, permissions) | Auth.js (next-auth v5) |
| `packages/database` | Drizzle schemas, client, migrations | Drizzle ORM, PostgreSQL |
| `packages/ui` | Design system components | Native React components, Tailwind CSS 4 |
| `packages/billing` | Payment integration | Stripe, AbacatePay |
| `packages/email` | Email templates and providers | React Email, Resend |
| `packages/routes` | Shared route definitions and URL keys | Zod |
| `packages/common` | Shared utilities (errors, type-guards, image, http) | — |
| `packages/analytics` | Analytics wrapper | PostHog |
| `packages/monitoring` | Error tracking | Sentry |

## Architecture Decisions


- **Drizzle ORM**: schema-as-TypeScript, lightweight, type-safe queries. Schemas organized by domain in `packages/database/src/schemas/<domain>/`.

- **Bun workspaces**: replaces pnpm for faster installs and native TS execution.

## Common Workflows

### Adding a new feature to the dashboard

1. If it needs new DB tables: add schema in `packages/database/src/schemas/<domain>/`
2. Run `bun --filter @workspace/database generate` then `bun --filter @workspace/database migrate` to apply (or `bun --filter @workspace/database push` for quick dev)
3. If it needs HTTP API: add Route Handlers in `apps/dashboard/app/api/<domain>/` (GET/POST/PUT/DELETE in `route.ts`). Use `@workspace/database` in the handler or in server-only functions.
4. Add UI components in `apps/dashboard/components/<feature>/`
5. Add page in `apps/dashboard/app/(protected)/<feature>/`
6. Prefer Server Actions for form-triggered mutations; use Route Handlers for webhooks, callbacks, and client-consumed APIs (fetch).

### Adding a new API route (Next.js)

1. Create `apps/dashboard/app/api/<segment>/route.ts` (or `[...slug]/route.ts` for catch-all). Export `GET`, `POST`, `PUT`, `PATCH`, or `DELETE` as appropriate.
2. Validate with Zod; access the DB with `@workspace/database` (or via functions in `features/<name>/*.server.ts`). For protected routes, use the session (Auth.js/next-auth) in the handler.
3. Return `NextResponse.json(data)` or `NextResponse.json({ error }, { status })`. For webhooks (e.g. billing), re-export from the package when it exists (e.g. `export { POST } from '@workspace/billing/webhook'`).
4. Docs: see `docs/api-routes-nextjs.md`.

### Changing an IEL prototype screen (`/iel`)

1. Screens live in `apps/dashboard/app/(iel)/iel/` and `apps/dashboard/components/iel-demo/`.
2. Every change that alters what a screen shows or does updates that screen's file in `docs/telas/` in the same PR. A new screen needs a new numbered file there plus a line in `docs/telas/00-indice.md`.
3. Keep the prototype out of the boilerplate: do not change `packages/ui`, `packages/charts` or other shared packages for it.

### Adding a new shared package

1. Create directory in `packages/<name>/`
2. Add `package.json` with name `@workspace/<name>`
3. Export via `exports` field in package.json
4. Import in consumers as `@workspace/<name>`

### Database schema changes

1. Edit schema files in `packages/database/src/schemas/<domain>/`
2. Run `bun --filter @workspace/database generate` to create migration files in `packages/database/drizzle/`
3. Run `bun --filter @workspace/database migrate` (Docker/prod) or `bun --filter @workspace/database push` (quick dev, no history)
4. Update any affected Zod schemas and DTOs

## Auth (Auth.js / next-auth v5)

- Implemented in `packages/auth` on **Auth.js v5 (`next-auth`)** with `@auth/drizzle-adapter`, served at `/api/auth/*` via Route Handlers in `apps/dashboard/app/api/auth/`. Session cookie is same-origin (dashboard).
- Access the session server-side with helpers like `getAuthContext()` / `getAuthOrganizationContext()` — do auth in **server layouts**, not middleware.
- Multi-tenant: `organizations` + `memberships`; roles are `ADMIN` / `MEMBER` plus an `isOwner` check (`packages/auth/.../permissions.ts`). Invitations flow lives in `packages/auth` + `@workspace/email` + `api/invitations/validate`.
- MFA/TOTP is supported (otplib + qrcode).

## Gotchas

- **UI kit**: `@workspace/ui` uses **native React components** (no PrimeReact/FlyonUI/Radix). Import everything from the `@workspace/ui` root (avoid subpaths). Styling is Tailwind CSS 4 + design tokens; theming via `packages/ui/src/styles/themes/*` (`default`, `catppuccin`, `cyberpunk`).
- **Global control roundness** is a single token: `--control-radius` (in `packages/ui/src/styles/base.css`).
- Do not reintroduce `better-auth` — it was an unused dependency and was removed.

## Dashboard Feature Pattern (data + actions)

- Keep initial reads in RSC via `features/<name>/data/get-*.ts` (`server-only`).
- If only server page/layout needs data, read directly with auth context + `@workspace/database` (no GET route).
- Create GET route in `app/api/...` only when browser or external HTTP also needs the same data.
- Keep mutations in `features/<name>/actions/*.ts` with `authActionClient` / `authOrganizationActionClient`, Zod schema, and `revalidatePath(...)`.
- Use `use-<name>.ts` only for client-only UX (submit, toast, loading, `router.refresh()`, browser APIs).
- Keep auth in layouts, not middleware, and use `routes.*` / `api.*` instead of hardcoded paths.
