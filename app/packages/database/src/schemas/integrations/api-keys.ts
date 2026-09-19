import { relations } from 'drizzle-orm';
import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar
} from 'drizzle-orm/pg-core';
import { organizationTable } from '../organizations/organizations';

/** Chaves de API por organização. */
export const apiKeyTable = pgTable(
  'apiKey',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    organizationId: uuid('organizationId')
      .notNull()
      .references(() => organizationTable.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade'
      }),
    description: varchar('description', { length: 70 }).notNull(),
    hashedKey: text('hashedKey').notNull(),
    expiresAt: timestamp('expiresAt', { precision: 3, mode: 'date' }),
    lastUsedAt: timestamp('lastUsedAt', { precision: 3, mode: 'date' }),
    createdAt: timestamp('createdAt', { precision: 3, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date())
  },
  (table) => [
    uniqueIndex('IX_apiKey_hashedKey_unique').using(
      'btree',
      table.hashedKey.asc().nullsLast().op('text_ops')
    ),
    index('IX_apiKey_organizationId').using(
      'btree',
      table.organizationId.asc().nullsLast().op('uuid_ops')
    )
  ]
);

// Relações
export const apiKeyRelations = relations(apiKeyTable, ({ one }) => ({
  organization: one(organizationTable, {
    fields: [apiKeyTable.organizationId],
    references: [organizationTable.id]
  })
}));
