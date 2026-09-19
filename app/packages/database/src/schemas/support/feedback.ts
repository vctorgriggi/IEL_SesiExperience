import { relations } from 'drizzle-orm';
import {
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar
} from 'drizzle-orm/pg-core';

import { userTable } from '../auth/users';

/** Mensagens de suporte (feedback) enviadas pelo dashboard. */
export const supportMessageTable = pgTable(
  'support_message',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    userId: uuid('userId')
      .notNull()
      .references(() => userTable.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade'
      }),
    subject: varchar('subject', { length: 200 }).notNull(),
    message: text('message').notNull(),
    createdAt: timestamp('createdAt', { precision: 3, mode: 'date' })
      .defaultNow()
      .notNull()
  },
  (table) => [
    index('IX_support_message_userId').using(
      'btree',
      table.userId.asc().nullsLast().op('uuid_ops')
    ),
    index('IX_support_message_createdAt').using(
      'btree',
      table.createdAt.desc().nullsLast()
    )
  ]
);

export const supportMessageRelations = relations(
  supportMessageTable,
  ({ one }) => ({
    user: one(userTable, {
      fields: [supportMessageTable.userId],
      references: [userTable.id]
    })
  })
);
