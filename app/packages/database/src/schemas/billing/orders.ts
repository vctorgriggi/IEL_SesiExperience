import { relations } from 'drizzle-orm';
import {
  doublePrecision,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar
} from 'drizzle-orm/pg-core';
import { organizationTable } from '../organizations/organizations';

/** Pedidos (compras únicas por organização). */
export const orderTable = pgTable(
  'order',
  {
    id: text('id').primaryKey(),
    organizationId: uuid('organizationId').notNull(),
    status: varchar('status', { length: 64 }).notNull(),
    provider: varchar('provider', { length: 32 }).notNull(),
    totalAmount: doublePrecision('totalAmount').notNull(),
    currency: varchar('currency', { length: 3 }).notNull(),
    createdAt: timestamp('createdAt', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updatedAt', { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => [
    index('IX_order_organizationId').using(
      'btree',
      table.organizationId.asc().nullsLast().op('uuid_ops')
    )
  ]
);

/** Itens do pedido (linhas). */
export const orderItemTable = pgTable(
  'orderItem',
  {
    id: text('id').primaryKey(),
    orderId: text('orderId').notNull(),
    quantity: integer('quantity').notNull(),
    productId: text('productId').notNull(),
    variantId: text('variantId').notNull(),
    priceAmount: doublePrecision('priceAmount'),
    type: text('type'),
    model: text('model')
  },
  (table) => [
    index('IX_orderItem_orderId').using(
      'btree',
      table.orderId.asc().nullsLast()
    )
  ]
);

export const orderRelations = relations(orderTable, ({ one, many }) => ({
  organization: one(organizationTable, {
    fields: [orderTable.organizationId],
    references: [organizationTable.id]
  }),
  items: many(orderItemTable)
}));

export const orderItemRelations = relations(orderItemTable, ({ one }) => ({
  order: one(orderTable, {
    fields: [orderItemTable.orderId],
    references: [orderTable.id]
  })
}));
