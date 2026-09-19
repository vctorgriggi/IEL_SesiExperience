import { relations } from 'drizzle-orm';
import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { aiMessageRoleEnum } from './enums';
import { aiConversationTable } from './conversations';

/** Mensagem individual dentro de uma conversa de IA. */
export const aiMessageTable = pgTable(
  'ai_message',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    conversationId: uuid('conversationId')
      .notNull()
      .references(() => aiConversationTable.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade'
      }),
    role: aiMessageRoleEnum('role').notNull(),
    content: text('content').notNull(),
    createdAt: timestamp('createdAt', { precision: 3, mode: 'date' })
      .defaultNow()
      .notNull()
  },
  (table) => [
    index('IX_ai_message_conversationId').using(
      'btree',
      table.conversationId.asc().nullsLast().op('uuid_ops')
    ),
    index('IX_ai_message_conversationId_createdAt').using(
      'btree',
      table.conversationId.asc().nullsLast().op('uuid_ops'),
      table.createdAt.asc().nullsLast().op('timestamp_ops')
    )
  ]
);

export const aiMessageRelations = relations(aiMessageTable, ({ one }) => ({
  conversation: one(aiConversationTable, {
    fields: [aiMessageTable.conversationId],
    references: [aiConversationTable.id]
  })
}));
