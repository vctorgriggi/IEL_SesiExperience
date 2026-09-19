# @workspace/routes

Centralized route definitions for the Arki workspace.

## Why a separate package?

Routes are defined in a separate package to:
- Keep authentication and other packages agnostic of app-specific routing
- Enable code reuse across multiple apps (dashboard, marketing, ai-chat, etc.)
- Provide type-safe route helpers and utilities
- **Enforce the API contract**: Apps and the product API use the same path definitions; refactoring a path in `api` here breaks callers at compile time instead of at runtime.

## Usage

```typescript
import { routes, baseUrl } from '@workspace/routes';

// Access routes
const signInUrl = routes.dashboard.auth.signIn;
const homeUrl = routes.dashboard.index;

// Build select-organization URLs
const selectOrgUrl = routes.dashboard.select('my-org');

// Get image URLs
import { getUserImageUrl, getContactImageUrl } from '@workspace/routes';

const userImage = getUserImageUrl(userId, hash);
const contactImage = getContactImageUrl(contactId, hash);
```

## Environment Variables

The routes package requires the following environment variables (defined in `keys.ts`):

- `NEXT_PUBLIC_DASHBOARD_URL` - Base URL for the dashboard app
- `NEXT_PUBLIC_MARKETING_URL` - Base URL for the marketing site

These are validated using Zod schemas from `@t3-oss/env-nextjs`.

