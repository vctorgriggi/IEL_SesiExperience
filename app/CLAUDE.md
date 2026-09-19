# Arki

SaaS starter kit in a Bun monorepo.

## Tech Stack

- **Runtime**: Bun 1.2.4+ and Node.js 20+
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript 5.8
- **Backend**: Route Handlers in `apps/dashboard/app/api/` plus Server Actions in the dashboard
- **Auth**: `@workspace/auth` served from `/api/auth/*` in the dashboard; the current implementation is based on Auth.js (`next-auth`)
- **Database**: Drizzle ORM + PostgreSQL (`pg` + `postgres`)
- **UI**: `@workspace/ui` (componentes nativos React, sem dependência de UI kit externo) + Tailwind CSS 4 + Hugeicons
- **Validation**: Zod across forms, routes, actions, and envs
- **Monorepo**: Turborepo + Bun workspaces
- **Billing**: Stripe / AbacatePay
- **Email**: `@workspace/email`
- **Storage**: Cloudinary and S3 via `@workspace/storage`
- **Monitoring**: `@workspace/monitoring`
- **Analytics**: `@workspace/analytics`

## Monorepo Structure

```text
apps/
  dashboard/       # Main app (:3000), auth, product API and the IEL prototype (/iel)

packages/
  ai/              # AI chat domain: conversations, messages, credits
  analytics/       # Analytics providers and helpers
  auth/            # Session, providers, permissions, cookies, MFA
  billing/         # Billing integration
  charts/          # Shared chart components
  common/          # Shared utilities
  database/        # Drizzle schemas, client, migrations, and scripts
  email/           # Email templates and providers
  monitoring/      # Monitoring
  rate-limit/      # In-memory/Redis rate limiting
  routes/          # Shared routes and env keys
  storage/         # Upload and storage helpers
  ui/              # Design system and global styles

tools/
  db/                  # Database helper scripts
  e2e/                 # Playwright helper webserver
  env-check/           # `quickstart` and `env-doctor`
  eslint-config/       # Shared ESLint config
  prettier-config/     # Shared Prettier config
  requirements-check/  # Machine requirements checks
  typescript-config/   # tsconfig presets
```

## Essential Commands

```bash
# Onboarding
bun install
bun run quickstart

# Development
bun run dev
bun --cwd apps/dashboard run dev

# Database
bun --cwd packages/database run generate
bun --cwd packages/database run migrate
bun --cwd packages/database run push
bun --cwd packages/database run studio
bun --cwd packages/database run seed-events

# Quality
bun run lint
bun run typecheck
bun run format
bun run test
bun --cwd apps/dashboard run test:e2e

# Utilities
bun run build
bun run analyze
bun run syncpack:list
bun run syncpack:fix
bun run tools/env-check/env-doctor.ts
```

## Local URLs

- Dashboard: `http://localhost:3000`
- IEL prototype: `http://localhost:3000/iel`

## Docker & Database

The root `docker-compose.yml` starts the local Postgres instance.

- Start it with `docker compose up`
- Use `DATABASE_URL=postgresql://arki_user:arki_password@localhost:5432/arki_events` for local development
- Run `bun --cwd packages/database run migrate` after the database is up

## Main Patterns

- **Dashboard is server-first**: initial reads should happen in React Server Components.
- **Dashboard features**: use `features/<name>/data/get-*.ts` for server-only reads and `features/<name>/actions/*.ts` for mutations with `next-safe-action`.
- **Route Handlers**: keep them in `apps/dashboard/app/api/<segment>/route.ts`; validate input with Zod and keep handlers thin.
- **Auth belongs in layouts, not middleware**: use server-side helpers such as `getAuthContext()` and `getAuthOrganizationContext()`.
- **UI imports**: prefer importing from the `@workspace/ui` root package; avoid subpath imports.
- **Routes**: use `@workspace/routes` (`routes.*`, `api.*`) instead of hardcoded strings.
- **Database**: use Drizzle with explicit selects; shared logic can live in server-only feature queries/fetchers.

## Code Conventions

- TypeScript strict mode; avoid `any`
- Prefer `type` over `interface`
- Use kebab-case for file names
- Use named exports
- Keep components small and focused
- Minimize `'use client'`
- Use Zod at every boundary
- Mock integrations at the boundary, not internal logic

## Testing Rules

- `bun run test` runs the test suite registered in Turbo
- `bun run test:coverage` runs the full suite with coverage and enforces the thresholds in `vitest.config.ts` (also runs in CI)
- `bun --cwd apps/dashboard run test:e2e` runs dashboard Playwright tests
- `vitest.setup.ts` injects an `AUTH_SECRET` compatible with test requirements

## Important Guides

- `README.md`
- `PATTERNS.md`
- `AGENTS.md`
- `docs/api-routes-nextjs.md`
- `docs/testing.md`
- `docs/deploy-checklist.md`
- `docs/repo-definition-of-done.md`
- `apps/dashboard/AGENTS.md`
- `.cursor/rules/dashboard-app-api.mdc`
- `.cursor/rules/feature-pattern-data-actions.mdc`
- `.cursor/rules/drizzle-database.mdc`
- `.cursor/rules/ui-and-styling.mdc`

## Environment Variables

Check each app/package `.env.example`. The main ones today are:

- `DATABASE_URL`
- `AUTH_SECRET`
- `NEXT_PUBLIC_DASHBOARD_URL`
- `NEXT_PUBLIC_MARKETING_URL`
- `BILLING_PROVIDER`
- `EMAIL_PROVIDER`
- `MONITORING_PROVIDER`
- `NEXT_PUBLIC_ANALYTICS_POSTHOG_KEY`
- `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

Validate everything with `bun run tools/env-check/env-doctor.ts`.

## Dashboard Feature Pattern (data + actions)

- Initial reads are server-first (RSC) via `features/<name>/data/get-*.ts` and `import 'server-only'`.
- Use direct DB reads + auth context when only RSC needs data; add GET route only for browser/external HTTP consumers.
- Mutations should live in `features/<name>/actions/*.ts` with `next-safe-action`, feature-local Zod schemas, and `revalidatePath(...)`.
- `use-<name>.ts` is optional and should only handle browser-side UX concerns.
- Keep auth in server layouts and use `routes.*`/`api.*` for paths.
