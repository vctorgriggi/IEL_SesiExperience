import { relations } from 'drizzle-orm';
import {
  index,
  pgTable,
  timestamp,
  uuid,
  varchar
} from 'drizzle-orm/pg-core';

import { userTable } from '../auth/users';
import { organizationTable } from '../organizations/organizations';

/** Conversa de chat com IA pertencente a um usuário. */
export const aiConversationTable = pgTable(
  'ai_conversation',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    userId: uuid('userId')
      .notNull()
      .references(() => userTable.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade'
      }),
    organizationId: uuid('organizationId').references(
      () => organizationTable.id,
      {
        onDelete: 'set null',
        onUpdate: 'cascade'
      }
    ),
    title: varchar('title', { length: 120 }).notNull(),
    model: varchar('model', { length: 64 }).notNull(),
    createdAt: timestamp('createdAt', { precision: 3, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date())
  },
  (table) => [
    index('IX_ai_conversation_userId').using(
      'btree',
      table.userId.asc().nullsLast().op('uuid_ops')
    ),
    index('IX_ai_conversation_userId_updatedAt').using(
      'btree',
      table.userId.asc().nullsLast().op('uuid_ops'),
      table.updatedAt.desc().nullsLast().op('timestamp_ops')
    )
  ]
);

export const aiConversationRelations = relations(
  aiConversationTable,
  ({ one }) => ({
    user: one(userTable, {
      fields: [aiConversationTable.userId],
      references: [userTable.id]
    }),
    organization: one(organizationTable, {
      fields: [aiConversationTable.organizationId],
      references: [organizationTable.id]
    })
  })
);
