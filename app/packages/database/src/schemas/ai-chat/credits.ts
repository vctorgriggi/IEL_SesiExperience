import { relations } from 'drizzle-orm';
import {
  index,
  integer,
  pgTable,
  timestamp,
  uuid,
  varchar
} from 'drizzle-orm/pg-core';

import { aiCreditPurchaseStatusEnum, aiCreditReasonEnum } from './enums';
import { userTable } from '../auth/users';

/**
 * Saldo de créditos de IA por usuário. `freeRemaining` é a cota gratuita
 * recorrente; `credits` são créditos comprados que não expiram.
 */
export const aiCreditBalanceTable = pgTable('ai_credit_balance', {
  userId: uuid('userId')
    .primaryKey()
    .notNull()
    .references(() => userTable.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade'
    }),
  freeRemaining: integer('freeRemaining').default(0).notNull(),
  credits: integer('credits').default(0).notNull(),
  updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date' })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
});

/**
 * Lançamentos imutáveis de crédito (auditoria). `delta` positivo credita,
 * negativo debita. `refId` guarda a referência externa (ex.: sessão de
 * pagamento) para idempotência.
 */
export const aiCreditLedgerTable = pgTable(
  'ai_credit_ledger',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    userId: uuid('userId')
      .notNull()
      .references(() => userTable.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade'
      }),
    delta: integer('delta').notNull(),
    reason: aiCreditReasonEnum('reason').notNull(),
    refId: varchar('refId', { length: 255 }),
    createdAt: timestamp('createdAt', { precision: 3, mode: 'date' })
      .defaultNow()
      .notNull()
  },
  (table) => [
    index('IX_ai_credit_ledger_userId').using(
      'btree',
      table.userId.asc().nullsLast().op('uuid_ops')
    ),
    index('IX_ai_credit_ledger_refId').using(
      'btree',
      table.refId.asc().nullsLast().op('text_ops')
    )
  ]
);

/**
 * Compra de créditos via checkout (AbacatePay). Mapeia o `billingId` do
 * provedor para o usuário e o pacote comprado, permitindo creditar de forma
 * idempotente quando o webhook de pagamento confirmar. Fica desacoplada do
 * billing de organização (`abacate_billing`).
 */
export const aiCreditPurchaseTable = pgTable(
  'ai_credit_purchase',
  {
    billingId: varchar('billingId', { length: 255 }).primaryKey().notNull(),
    userId: uuid('userId')
      .notNull()
      .references(() => userTable.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade'
      }),
    credits: integer('credits').notNull(),
    amountCents: integer('amountCents').notNull(),
    status: aiCreditPurchaseStatusEnum('status').default('pending').notNull(),
    createdAt: timestamp('createdAt', { precision: 3, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date())
  },
  (table) => [
    index('IX_ai_credit_purchase_userId').using(
      'btree',
      table.userId.asc().nullsLast().op('uuid_ops')
    )
  ]
);

export const aiCreditPurchaseRelations = relations(
  aiCreditPurchaseTable,
  ({ one }) => ({
    user: one(userTable, {
      fields: [aiCreditPurchaseTable.userId],
      references: [userTable.id]
    })
  })
);

export const aiCreditBalanceRelations = relations(
  aiCreditBalanceTable,
  ({ one }) => ({
    user: one(userTable, {
      fields: [aiCreditBalanceTable.userId],
      references: [userTable.id]
    })
  })
);

export const aiCreditLedgerRelations = relations(
  aiCreditLedgerTable,
  ({ one }) => ({
    user: one(userTable, {
      fields: [aiCreditLedgerTable.userId],
      references: [userTable.id]
    })
  })
);
