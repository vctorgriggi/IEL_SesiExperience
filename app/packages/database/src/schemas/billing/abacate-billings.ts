import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar
} from 'drizzle-orm/pg-core';
import { organizationTable } from '../organizations/organizations';

export const abacateBillingsTable = pgTable(
  'abacate_billing',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizationTable.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade'
      }),
    billingId: text('billing_id').notNull().unique(),
    status: varchar('status', { length: 32 }).notNull().default('PENDING'),

    /** @deprecated Use productId + priceId + billingInterval + priceType. */
    planType: varchar('plan_type', { length: 16 }),

    productId: varchar('product_id', { length: 32 }),
    priceId: text('price_id'),
    billingInterval: varchar('billing_interval', { length: 16 }),
    priceType: varchar('price_type', { length: 16 }),

    amount: integer('amount').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date())
  },
  (table) => [
    index('IX_abacate_billing_organization_id').on(table.organizationId),
    index('IX_abacate_billing_billing_id').on(table.billingId)
  ]
);
