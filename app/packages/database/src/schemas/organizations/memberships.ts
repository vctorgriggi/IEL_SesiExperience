import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar
} from 'drizzle-orm/pg-core';
import {
  invitationStatusEnum,
  InvitationStatus,
  roleEnum,
  Role
} from '../shared/enums';
import { userTable } from '../auth/users';
import { organizationTable } from './organizations';

/** Vínculo usuário–organização com papel (role). */
export const membershipTable = pgTable(
  'membership',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    organizationId: uuid('organizationId')
      .notNull()
      .references(() => organizationTable.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade'
      }),
    userId: uuid('userId')
      .notNull()
      .references(() => userTable.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade'
      }),
    role: roleEnum('role').default(Role.MEMBER).notNull(),
    isOwner: boolean('isOwner').default(false).notNull(),
    createdAt: timestamp('createdAt', { precision: 3, mode: 'date' })
      .defaultNow()
      .notNull()
  },
  (table) => [
    uniqueIndex('IX_membership_organizationId_userId_unique').using(
      'btree',
      table.organizationId.asc().nullsLast().op('uuid_ops'),
      table.userId.asc().nullsLast().op('uuid_ops')
    ),
    index('IX_membership_userId').using(
      'btree',
      table.userId.asc().nullsLast().op('uuid_ops')
    ),
    index('IX_membership_organizationId').using(
      'btree',
      table.organizationId.asc().nullsLast().op('uuid_ops')
    )
  ]
);

/** Convites para novos membros da organização. */
export const invitationTable = pgTable(
  'invitation',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    organizationId: uuid('organizationId')
      .notNull()
      .references(() => organizationTable.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade'
      }),
    token: uuid('token').notNull().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull(),
    role: roleEnum('role').default(Role.MEMBER).notNull(),
    status: invitationStatusEnum('status')
      .default(InvitationStatus.PENDING)
      .notNull(),
    lastSentAt: timestamp('lastSentAt', { precision: 3, mode: 'date' }),
    createdAt: timestamp('createdAt', { precision: 3, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date())
  },
  (table) => [
    index('IX_invitation_organizationId').using(
      'btree',
      table.organizationId.asc().nullsLast().op('uuid_ops')
    ),
    index('IX_invitation_token').using(
      'btree',
      table.token.asc().nullsLast().op('uuid_ops')
    )
  ]
);

// Relações
export const membershipRelations = relations(membershipTable, ({ one }) => ({
  organization: one(organizationTable, {
    fields: [membershipTable.organizationId],
    references: [organizationTable.id]
  }),
  user: one(userTable, {
    fields: [membershipTable.userId],
    references: [userTable.id]
  })
}));

export const invitationRelations = relations(invitationTable, ({ one }) => ({
  organization: one(organizationTable, {
    fields: [invitationTable.organizationId],
    references: [organizationTable.id]
  })
}));
