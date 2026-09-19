import { pgTable, text, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';

/** Idempotência de webhooks de billing (Stripe/AbacatePay). Índice (eventId, service) evita race. */
export const billingWebhookEventsTable = pgTable(
  'billing_webhook_event',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    eventId: text('event_id').notNull(),
    service: varchar('service', { length: 32 }).notNull(),
    eventType: varchar('event_type', { length: 64 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex('UQ_billing_webhook_event_event_id_service').on(table.eventId, table.service)
  ]
);
