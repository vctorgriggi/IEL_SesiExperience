# Agents — Dashboard (Next.js)

Context for AI agents working on the main dashboard application.

## Overview

The dashboard is a Next.js 15 App Router application running on port 3000. It provides the authenticated user experience: event management, billing, account settings, and organization management.

**Out of scope:** AI Chat is not part of the dashboard. Do not add AI Chat features, routes, sidebar links, or dependencies (`@workspace/ai-chat`) to this app.

## Project Structure

```
apps/dashboard/
  app/
    (auth)/                    # Public auth + invitation pages
      auth/                    # sign-in, sign-up, forgot/reset password, totp, verify email
      invitations/             # invitation acceptance/request/revoked flows
    (protected)/               # Authenticated area
      (organizations)/[slug]/  # Org-scoped pages: home, events, calendar, checkin, map, billing, settings, support
      onboarding/              # Onboarding routes (user + organization)
      select/                  # Organization selector
      invite/                  # Invitation redirect flow
    api/                       # Next.js Route Handlers: auth, billing/webhook, invitations/validate, support/contact
    open-events/               # Public event pages (slug + confirmation)
    layout.tsx                 # Root layout
    providers.tsx              # Client providers (theme, analytics)
  actions/                     # Shared safe-action client (safe-action.ts)
  features/                    # Feature folders: data/ + actions/ + schemas/ + optional service/hook
    account/                   # profile, password, MFA, avatar
    auth/                      # auth actions + schemas + constants
    billing/                   # plans, checkout/portal actions, billing data
    events/                    # events CRUD, registrations, check-in, public event flows
    home/                      # dashboard stats/charts data
    invitations/               # invitation actions + token validation
    members/                   # membership data + role actions
    onboarding/                # onboarding completion action + schema
    organizations/             # org actions/data/schemas + helpers
    webhooks/                  # webhook-related domain helpers
  components/                  # UI components (consume features/hooks)
    account/, analytics/, auth/, calendar/, checkin/, choose-plan/, dashboard/
    events/, home/, invitations/, layout/, loading/, map/, onboarding/, settings/, shell/, support/
  hooks/                       # Shared hooks only (forms/auth helpers + org slug helpers)
  lib/                         # Shared cross-domain utils only (api-client, fetch helpers, generic formatters/errors)
  types/                       # Shared app-level types (e.g. page props)
  docs/                        # Dashboard docs
  e2e/                         # Playwright tests
  env.ts                       # Typed env vars via @t3-oss/env-nextjs
  middleware.ts                # Attaches lightweight request context (x-organization-slug, x-pathname)
```

## Key Patterns

- **React Server Components by default**. Only add `'use client'` when truly needed (forms, interactivity, hooks).
- **Feature folders**: Each feature has server data in `features/<name>/data/` (one file per get, `server-only`), Server Actions in `features/<name>/actions/`, shared Zod schemas in `features/<name>/schemas/`, and optional client hooks/services only when the browser really needs them. Shared action client: `actions/safe-action.ts` (authActionClient, authOrganizationActionClient).
- **RSC reads by default**: Pages/layouts load initial data from `features/<name>/data/get-*.ts`. Avoid `useQuery` for reads that can happen on the server.
- **Client components**: Hooks in `use-<name>.ts` are mainly for mutations, local pending/error state, toast, and `router.refresh()`. Do not add client guards/fetch duplication if the server layout/page can decide.
- **Schemas**: Feature-specific Zod schemas live in `features/<name>/schemas/`. Avoid loose `*-schema.ts` files spread at the feature root when they are shared across the feature.
- **State**: Prefer RSC + `router.refresh()` for data; client state only for mutations and local UI.
- **Modals**: `Dialog` / `Modal` (native, via `@workspace/ui`). **Tables**: TanStack Table — use `useReactTable` + column defs (e.g. `createColumnHelper`) + `flexRender` for header/cells; use table primitives from `@workspace/ui` (Table, TableHeader, TableBody, TableRow, TableHead, TableCell) for markup.
- **UI**: Use a single import from `@workspace/ui` for all components and utilities (e.g. `import { Button, Card, Input, Table, Select, MetricCard, ... } from '@workspace/ui'`). Do not use subpaths like `@workspace/ui/button` or `@workspace/ui/card`. Use Tailwind and design tokens for styling; all components are native React components from `@workspace/ui` (Button, Input, Checkbox, etc.).
- **Routing/auth**: Auth belongs in server layouts (`getAuthContext()`, `getAuthOrganizationContext()`), not in the middleware. Middleware should only attach lightweight request context like `x-organization-slug` and `x-pathname`.
- **Routes**: Use `@workspace/routes` (`routes.*`, `api.*`) instead of hardcoded path strings.

## Feature pattern: data/ + actions/

Features that need server data and mutations follow the **data/ + actions/** pattern. Use it for new features and when migrating legacy client-first flows.

- **Data:** `features/<name>/data/get-<algo>.ts` — `server-only`, one file per get; RSC import from `@/features/<name>/data/get-*`.
- **Actions:** `features/<name>/actions/<action>.ts` — `'use server'`, next-safe-action (`authActionClient` / `authOrganizationActionClient`), Zod schema, `revalidatePath`.
- **Hook:** `use-<name>.ts` — optional; mutations call actions (or client API for e.g. file upload); invalidate queries, toast, `router.refresh()`.

**Decision rule:** use `data/get-*.ts` + direct DB/auth context when only RSC needs the data; create `app/api` GET only when browser/external HTTP also consumes it. Reference implementations: `features/auth/` and `features/organizations/`.

## Adding a New Feature

1. Create `features/<name>/` following the data + actions feature pattern: `data/get-*.ts` (server-only fetchers), `actions/*.ts` (Server Actions with next-safe-action), `schemas/`, optional `use-<name>.ts` (client mutations only when needed), optional `<name>.ts` (client API for browser-only cases, e.g. file upload).
2. Add UI in `components/<feature>/` that import hooks from `@/features/<name>/use-<name>`.
3. Add page at `app/(protected)/<feature>/page.tsx`; if it needs server data, import from `@/features/<name>/data/get-*`.
4. Add navigation in `components/layout/sidebar/` if needed.

## Auth Flow

- Auth pages live in `app/(auth)/` — public layout, no sidebar.
- Protected pages in `app/(protected)/` — authenticated layout with sidebar.
- **Auth.js (next-auth v5)** is served at `/api/auth/*` via Route Handlers in `app/api/auth/`. Session cookie is same-origin (dashboard).
- Session is validated server-side via layout/context helpers (`getAuthContext()`, `getAuthOrganizationContext()`, or `dedupedAuth()` from `@workspace/auth` when only session lookup is needed).
- OAuth and credentials supported; TOTP and recovery codes for 2FA.
- Auth mutations use Server Actions by default; OAuth start/callback remains route-based.

## API (Route Handlers)

- **app/api/** — Next.js Route Handlers. Implementação da API do produto: auth, webhooks (billing, etc.), export, health, imagens. Lógica de domínio e acesso a `@workspace/database` podem ficar nos handlers ou em funções server-only chamadas por eles.
- **Client**: UI chama hook só quando precisa de mutation/UI state; o hook chama Server Action ou client API browser-only; use `router.refresh()` após mutações para atualizar dados do RSC.
- **Server**: RSC usam fetchers em `features/<name>/data/get-*.ts`; esses fetchers usam `@workspace/database`, `@workspace/auth` ou same-origin fetch para `app/api/`. Paths compartilhados devem vir de `@workspace/routes`.

## Loading and error states

- Main route segments have `loading.tsx` and `error.tsx`: `(protected)/`, `(auth)/`.

## Testing

- Unit tests for critical paths next to the code. Mock at the boundary (api-client, routes). Run from repo root: `bun run test:unit -- apps/dashboard`.

## Dependencies

- `@workspace/auth` — session, permissions
- `@workspace/ui` — UI components e utilitários (preferir import único do pacote raiz)
- `@workspace/routes` — typed route paths
- `@workspace/analytics`, `@workspace/monitoring`, `@workspace/email` (indirect)

The dashboard **can** use `@workspace/database` in server-only code (Route Handlers, Server Actions, `features/*/data/get-*.ts`). Use Zod schemas at boundaries. Do not import the DB client in client components.
