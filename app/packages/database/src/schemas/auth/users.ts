import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar
} from 'drizzle-orm/pg-core';
import { bytea } from '../shared/types';

/** Tabela de usuários (dados principais). */
export const userTable = pgTable(
  'user',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    email: text('email').unique(),
    emailVerified: timestamp('emailVerified', { precision: 3, mode: 'date' }),
    password: varchar('password', { length: 60 }),
    lastLogin: timestamp('lastLogin', { precision: 3, mode: 'date' }),
    locale: varchar('locale', { length: 8 }).default('en-US').notNull(),
    completedOnboarding: boolean('completedOnboarding')
      .default(false)
      .notNull(),
    enabledContactsNotifications: boolean('enabledContactsNotifications')
      .default(false)
      .notNull(),
    enabledInboxNotifications: boolean('enabledInboxNotifications')
      .default(false)
      .notNull(),
    enabledNewsletter: boolean('enabledNewsletter').default(false).notNull(),
    enabledProductUpdates: boolean('enabledProductUpdates')
      .default(false)
      .notNull(),
    enabledWeeklySummary: boolean('enabledWeeklySummary')
      .default(false)
      .notNull(),
    image: varchar('image', { length: 2048 }),
    name: varchar('name', { length: 64 }).notNull(),
    phone: varchar('phone', { length: 32 }),
    createdAt: timestamp('createdAt', { precision: 3, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date())
  },
  (table) => [
    uniqueIndex('IX_user_email_unique').using(
      'btree',
      table.email.asc().nullsLast().op('text_ops')
    ),
    index('IX_user_name').using(
      'btree',
      table.name.asc().nullsLast().op('text_ops')
    )
  ]
);

/** Imagens de perfil do usuário (binário). */
export const userImageTable = pgTable(
  'userImage',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    userId: uuid('userId')
      .notNull()
      .references(() => userTable.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade'
      }),
    data: bytea('data'),
    contentType: varchar('contentType', { length: 255 }),
    hash: varchar('hash', { length: 64 })
  },
  (table) => [
    index('IX_userImage_userId').using(
      'btree',
      table.userId.asc().nullsLast().op('uuid_ops')
    )
  ]
);

/** Notificações do usuário. */
export const notificationTable = pgTable(
  'notification',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    userId: uuid('userId')
      .notNull()
      .references(() => userTable.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade'
      }),
    subject: varchar('subject', { length: 128 }),
    content: varchar('content', { length: 8000 }).notNull(),
    link: varchar('link', { length: 2000 }),
    seenAt: timestamp('seenAt', { precision: 3, mode: 'date' }),
    dismissed: boolean('dismissed').default(false).notNull(),
    createdAt: timestamp('createdAt', { precision: 3, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date())
  },
  (table) => [
    index('IX_notification_userId').using(
      'btree',
      table.userId.asc().nullsLast().op('uuid_ops')
    )
  ]
);

// Relações
export const userRelations = relations(userTable, ({ many }) => ({
  notifications: many(notificationTable)
}));

export const notificationRelations = relations(
  notificationTable,
  ({ one }) => ({
    user: one(userTable, {
      fields: [notificationTable.userId],
      references: [userTable.id]
    })
  })
);
