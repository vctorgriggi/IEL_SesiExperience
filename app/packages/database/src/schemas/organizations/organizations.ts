import { relations } from 'drizzle-orm';
import {
  index,
  pgTable,
  uniqueIndex,
  uuid,
  varchar
} from 'drizzle-orm/pg-core';
import { bytea } from '../shared/types';
/**
 * Organizações 
 */
export const organizationTable = pgTable(
  'organization',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    address: varchar('address', { length: 255 }),
    email: varchar('email', { length: 255 }),
    website: varchar('website', { length: 2000 }),
    phone: varchar('phone', { length: 32 }),
    facebookPage: varchar('facebookPage', { length: 2000 }),
    instagramProfile: varchar('instagramProfile', { length: 2000 }),
    linkedInProfile: varchar('linkedInProfile', { length: 2000 }),
    tikTokProfile: varchar('tikTokProfile', { length: 2000 }),
    xProfile: varchar('xProfile', { length: 2000 }),
    youTubeChannel: varchar('youTubeChannel', { length: 2000 }),
    logo: varchar('logo', { length: 2048 }),
    slug: varchar('slug', { length: 255 }).notNull(),
    billingCustomerId: varchar('billingCustomerId', { length: 255 }),
    billingEmail: varchar('billingEmail', { length: 255 }),
    billingLine1: varchar('billingLine1', { length: 255 }),
    billingLine2: varchar('billingLine2', { length: 255 }),
    billingCountry: varchar('billingCountry', { length: 3 }),
    billingPostalCode: varchar('billingPostalCode', { length: 16 }),
    billingCity: varchar('billingCity', { length: 255 }),
    billingState: varchar('billingState', { length: 255 })
  },
  (table) => [
    index('IX_organization_billingCustomerId').using(
      'btree',
      table.billingCustomerId.asc().nullsLast().op('text_ops')
    ),
    uniqueIndex('IX_organization_slug_unique').using(
      'btree',
      table.slug.asc().nullsLast().op('text_ops')
    )
  ]
);

/** Logo da organização (binário). */
export const organizationLogoTable = pgTable(
  'organizationLogo',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    organizationId: uuid('organizationId')
      .notNull()
      .references(() => organizationTable.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade'
      }),
    data: bytea('data'),
    contentType: varchar('contentType', { length: 255 }),
    hash: varchar('hash', { length: 64 })
  },
  (table) => [
    index('IX_organizationLogo_organizationId').using(
      'btree',
      table.organizationId.asc().nullsLast().op('uuid_ops')
    )
  ]
);

// Relações
export const organizationLogoRelations = relations(
  organizationLogoTable,
  ({ one }) => ({
    organization: one(organizationTable, {
      fields: [organizationLogoTable.organizationId],
      references: [organizationTable.id]
    })
  })
);