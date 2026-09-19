import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  vector
} from 'drizzle-orm/pg-core';

import { userTable } from '../auth/users';
import { aiKnowledgeDocumentStatusEnum } from './enums';

export const aiKnowledgeDocumentTable = pgTable('ai_knowledge_document', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  fileName: varchar('fileName', { length: 255 }).notNull(),
  mimeType: varchar('mimeType', { length: 64 }).notNull(),
  status: aiKnowledgeDocumentStatusEnum('status')
    .default('processing')
    .notNull(),
  error: text('error'),
  chunkCount: integer('chunkCount').default(0).notNull(),
  uploadedBy: uuid('uploadedBy').references(() => userTable.id, {
    onDelete: 'set null',
    onUpdate: 'cascade'
  }),
  createdAt: timestamp('createdAt', { precision: 3, mode: 'date' })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date' })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
});

export const aiKnowledgeChunkTable = pgTable(
  'ai_knowledge_chunk',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    documentId: uuid('documentId')
      .notNull()
      .references(() => aiKnowledgeDocumentTable.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade'
      }),
    chunkIndex: integer('chunkIndex').notNull(),
    content: text('content').notNull(),
    embedding: vector('embedding', { dimensions: 1536 }).notNull(),
    createdAt: timestamp('createdAt', { precision: 3, mode: 'date' })
      .defaultNow()
      .notNull()
  },
  (table) => [
    index('IX_ai_knowledge_chunk_documentId').using(
      'btree',
      table.documentId.asc().nullsLast().op('uuid_ops')
    ),
    index('IX_ai_knowledge_chunk_embedding').using(
      'hnsw',
      table.embedding.op('vector_cosine_ops')
    )
  ]
);
