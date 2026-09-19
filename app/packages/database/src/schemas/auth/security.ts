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
import { userTable } from './users';

/** 2FA: segredo TOTP e códigos de backup. */
export const twoFactorTable = pgTable(
  'two_factor',
  {
    id: text('id').primaryKey(),
    secret: text('secret').notNull(),
    backupCodes: text('backup_codes').notNull(),
    userId: uuid('userId')
      .notNull()
      .references(() => userTable.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date())
  },
  (table) => [
    index('two_factor_secret_idx').on(table.secret),
    index('two_factor_user_id_idx').on(table.userId)
  ]
);

/** Apps autenticadores (TOTP/2FA). */
export const authenticatorAppTable = pgTable(
  'authenticatorApp',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    userId: uuid('userId')
      .notNull()
      .references(() => userTable.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade'
      }),
    accountName: varchar('accountName', { length: 255 }).notNull(),
    issuer: varchar('issuer', { length: 255 }).notNull(),
    secret: varchar('secret', { length: 255 }).notNull(),
    recoveryCodes: varchar('recoveryCodes', { length: 1024 }).notNull(),
    createdAt: timestamp('createdAt', { precision: 3, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date())
  },
  (table) => [
    uniqueIndex('IX_authenticatorApp_userId_unique').using(
      'btree',
      table.userId.asc().nullsLast().op('uuid_ops')
    )
  ]
);

/** Solicitações de troca de e-mail. */
export const changeEmailRequestTable = pgTable(
  'changeEmailRequest',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    userId: uuid('userId')
      .notNull()
      .references(() => userTable.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade'
      }),
    email: text('email').notNull(),
    expires: timestamp('expires', { precision: 3, mode: 'date' }).notNull(),
    valid: boolean('valid').default(false).notNull(),
    createdAt: timestamp('createdAt', { precision: 3, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date())
  },
  (table) => [
    index('IX_changeEmailRequest_userId').using(
      'btree',
      table.userId.asc().nullsLast().op('uuid_ops')
    )
  ]
);

/** Solicitações de redefinição de senha. */
export const resetPasswordRequestTable = pgTable(
  'resetPasswordRequest',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    email: text('email').notNull(),
    expires: timestamp('expires', { precision: 3, mode: 'date' }).notNull(),
    createdAt: timestamp('createdAt', { precision: 3, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date())
  },
  (table) => [
    index('IX_resetPasswordRequest_email').using(
      'btree',
      table.email.asc().nullsLast().op('text_ops')
    )
  ]
);

// Relações
export const twoFactorRelations = relations(twoFactorTable, ({ one }) => ({
  user: one(userTable, {
    fields: [twoFactorTable.userId],
    references: [userTable.id]
  })
}));

export const authenticatorAppRelations = relations(
  authenticatorAppTable,
  ({ one }) => ({
    user: one(userTable, {
      fields: [authenticatorAppTable.userId],
      references: [userTable.id]
    })
  })
);

export const changeEmailRequestRelations = relations(
  changeEmailRequestTable,
  ({ one }) => ({
    user: one(userTable, {
      fields: [changeEmailRequestTable.userId],
      references: [userTable.id]
    })
  })
);
