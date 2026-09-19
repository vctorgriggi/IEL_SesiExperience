import { relations } from 'drizzle-orm';
import {
  boolean,
  doublePrecision,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar
} from 'drizzle-orm/pg-core';
import { organizationTable } from '../organizations/organizations';

/** Assinaturas da organização. */
export const subscriptionTable = pgTable(
  'subscription',
  {
    id: text('id').primaryKey(),
    organizationId: uuid('organizationId').notNull(),
    status: varchar('status', { length: 64 }).notNull(),
    active: boolean('active').notNull().default(false),
    provider: varchar('provider', { length: 32 }).notNull(),
    cancelAtPeriodEnd: boolean('cancelAtPeriodEnd').notNull().default(false),
    currency: varchar('currency', { length: 3 }).notNull(),
    periodStartsAt: timestamp('periodStartsAt', {
      withTimezone: true,
      precision: 6
    }).notNull(),
    periodEndsAt: timestamp('periodEndsAt', {
      withTimezone: true,
      precision: 6
    }).notNull(),
    trialStartsAt: timestamp('trialStartsAt', {
      withTimezone: true,
      precision: 6
    }),
    trialEndsAt: timestamp('trialEndsAt', {
      withTimezone: true,
      precision: 6
    }),
    createdAt: timestamp('createdAt', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updatedAt', { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => [
    index('IX_subscription_organizationId').using(
      'btree',
      table.organizationId.asc().nullsLast().op('uuid_ops')
    )
  ]
);

/** Itens da assinatura (linhas). */
export const subscriptionItemTable = pgTable(
  'subscriptionItem',
  {
    id: text('id').primaryKey(),
    subscriptionId: text('subscriptionId').notNull(),
    quantity: integer('quantity').notNull(),
    productId: text('productId').notNull(),
    variantId: text('variantId').notNull(),
    priceAmount: doublePrecision('priceAmount'),
    interval: text('interval').notNull(),
    intervalCount: integer('intervalCount').notNull(),
    type: text('type'),
    model: text('model')
  },
  (table) => [
    index('IX_subscriptionItem_subscriptionId').using(
      'btree',
      table.subscriptionId.asc().nullsLast()
    )
  ]
);

// Relações
export const subscriptionRelations = relations(
  subscriptionTable,
  ({ one, many }) => ({
    organization: one(organizationTable, {
      fields: [subscriptionTable.organizationId],
      references: [organizationTable.id]
    }),
    items: many(subscriptionItemTable)
  })
);

export const subscriptionItemRelations = relations(
  subscriptionItemTable,
  ({ one }) => ({
    subscription: one(subscriptionTable, {
      fields: [subscriptionItemTable.subscriptionId],
      references: [subscriptionTable.id]
    })
  })
);
