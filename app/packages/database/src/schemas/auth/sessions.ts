import { relations } from 'drizzle-orm';
import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid
} from 'drizzle-orm/pg-core';
import type { AdapterAccountType } from 'next-auth/adapters';
import { userTable } from './users';

export const sessionTable = pgTable(
  'session',
  {
    sessionToken: text('sessionToken').primaryKey(),
    userId: uuid('userId')
      .notNull()
      .references(() => userTable.id, { onDelete: 'cascade' }),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
    createdAt: timestamp('createdAt', { precision: 3, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date())
  },
  (table) => [
    index('IX_session_userId').using(
      'btree',
      table.userId.asc().nullsLast().op('uuid_ops')
    )
  ]
);

export const accountTable = pgTable(
  'account',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    userId: uuid('userId')
      .notNull()
      .references(() => userTable.id, { onDelete: 'cascade' }),
    type: text('type').$type<AdapterAccountType>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    password: text('password'),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
    createdAt: timestamp('createdAt', { precision: 3, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date())
  },
  (table) => [
    uniqueIndex('IX_account_provider_providerAccountId_unique').using(
      'btree',
      table.provider.asc().nullsLast().op('text_ops'),
      table.providerAccountId.asc().nullsLast().op('text_ops')
    ),
    index('IX_account_userId').using(
      'btree',
      table.userId.asc().nullsLast().op('uuid_ops')
    )
  ]
);

export const verificationTokenTable = pgTable(
  'verificationToken',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { precision: 3, mode: 'date' }).notNull()
  },
  (table) => [
    uniqueIndex('IX_verificationToken_identifier_unique').using(
      'btree',
      table.identifier.asc().nullsLast().op('text_ops'),
      table.token.asc().nullsLast().op('text_ops')
    )
  ]
);

export const sessionRelations = relations(sessionTable, ({ one }) => ({
  user: one(userTable, {
    fields: [sessionTable.userId],
    references: [userTable.id]
  })
}));

export const accountRelations = relations(accountTable, ({ one }) => ({
  user: one(userTable, {
    fields: [accountTable.userId],
    references: [userTable.id]
  })
}));
