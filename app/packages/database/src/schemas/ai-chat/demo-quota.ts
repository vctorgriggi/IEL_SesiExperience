import { integer, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';

export const aiDemoQuotaTable = pgTable('ai_demo_quota', {
  ip: varchar('ip', { length: 64 }).primaryKey().notNull(),
  messagesUsed: integer('messagesUsed').default(0).notNull(),
  uploadsUsed: integer('uploadsUsed').default(0).notNull(),
  createdAt: timestamp('createdAt', { precision: 3, mode: 'date' })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date' })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
});
