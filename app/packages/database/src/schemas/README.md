# Database Schemas

This directory contains all database table definitions organized by domain for better maintainability and clarity.

## Structure

```
schemas/
├── shared/          # Shared types, enums, and utilities
│   ├── types.ts     # Custom Drizzle types (bytea, etc.)
│   └── enums.ts     # Shared enums used across schemas
│
├── auth/            # Authentication and user management
│   ├── users.ts     # User table, images, notifications
│   ├── sessions.ts  # Better Auth sessions, accounts, verification
│   └── security.ts  # 2FA, password resets, email changes
│
├── organizations/   # Organization management
│   ├── organizations.ts  # Organization table, logos, feedback
│   ├── memberships.ts    # User-org relationships, invitations
│   └── work-hours.ts     # Business hours configuration
│
├── events/          # Event management
│   └── events.ts    # Events and registrations
│
├── integrations/    # External integrations
│   ├── webhooks.ts  # Webhook configurations
│   └── api-keys.ts  # API key management
│
└── billing/         # Subscription and billing
    └── subscriptions.ts  # Subscriptions and items
```

## Usage

### Importing schemas

```typescript
// Import specific tables
import { userTable, organizationTable } from '@workspace/database';

// Import from specific domain
import { eventTable } from '@workspace/database/schemas/events';

// Import all schemas
import * as schemas from '@workspace/database/schemas';
```

### Creating new schemas

When adding new tables:

1. **Choose the appropriate domain folder** or create a new one if needed
2. **Follow naming conventions:**
   - Tables: `[name]Table` (e.g., `userTable`)
   - Relations: `[name]Relations` (e.g., `userRelations`)
   - Enums: Keep in `shared/enums.ts` if used across domains
3. **Add indexes** for foreign keys and frequently queried fields
4. **Include JSDoc comments** to describe the table's purpose
5. **Export from domain's index.ts** and main `schemas/index.ts`

### Schema Design Principles

- **Cascade deletes:** Used for dependent data (e.g., child records)
- **Set null:** Used for optional references that shouldn't block deletion
- **Timestamps:** All tables include `createdAt` and `updatedAt`
- **UUIDs:** Primary keys use UUID v4 for security and distribution
- **Indexes:** Add for all foreign keys and frequently filtered columns

## Removed Features

- **Orders:** The order/orderItem tables were removed as they're not needed for the event management system. Subscriptions handle all recurring billing needs.

## Migration Notes

The schemas were reorganized from a single 1400+ line file into semantic folders. The old `schema.ts` file now re-exports everything for backwards compatibility, but new code should import from specific domain folders.

