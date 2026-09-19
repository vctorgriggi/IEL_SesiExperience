import { relations } from 'drizzle-orm';
import { index, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { webhookTriggerEnum } from '../shared/enums';
import { organizationTable } from '../organizations/organizations';

/** Configurações de webhook por organização. */
export const webhookTable = pgTable(
  'webhook',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizationTable.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade'
      }),
    secret: varchar('secret', { length: 1024 }),
    createdAt: timestamp('created_at', { precision: 3, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { precision: 3, mode: 'date' })
      .defaultNow()
      .notNull(),
    triggers: webhookTriggerEnum('triggers').array().notNull(),
    url: varchar('url', { length: 2000 }).notNull()
  },
  (table) => [
    index('IX_webhook_organization_id').on(table.organizationId)
  ]
);

// Relações
export const webhookRelations = relations(webhookTable, ({ one }) => ({
  organization: one(organizationTable, {
    fields: [webhookTable.organizationId],
    references: [organizationTable.id]
  })
}));

