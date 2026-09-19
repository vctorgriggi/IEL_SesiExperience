import { relations, sql } from 'drizzle-orm';
import { userTable } from '../auth/users';
import { organizationTable } from '../organizations/organizations';
import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  index,
  uniqueIndex
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';

/** Eventos (dados principais). */
export const eventTable = pgTable(
  'event',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizationTable.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade'
      }),
    slug: text('slug')
      .notNull()
      .default(sql`gen_random_uuid()::text`),
    title: text('title').notNull(),
    description: text('description'),
    startDate: timestamp('start_date', { withTimezone: true }).notNull(),
    endDate: timestamp('end_date', { withTimezone: true }).notNull(),
    location: text('location'),
    imageUrl: text('image_url'),
    ticketType: text('ticket_type', {
      enum: ['free', 'paid']
    })
      .notNull()
      .default('free'),
    ticketPriceCents: integer('ticket_price_cents'),
    latitude: doublePrecision('latitude'),
    longitude: doublePrecision('longitude'),
    maxAttendees: integer('max_attendees'),
    isPublic: boolean('is_public').notNull().default(false),
    status: text('status', {
      enum: ['draft', 'published', 'cancelled', 'completed']
    })
      .notNull()
      .default('draft'),
    metadata: jsonb('metadata'),
    createdById: uuid('created_by_id')
      .notNull()
      .references(() => userTable.id, {
        onDelete: 'restrict',
        onUpdate: 'cascade'
      }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date())
  },
  (table) => [
    index('IX_event_organization_id').using(
      'btree',
      table.organizationId.asc().nullsLast().op('uuid_ops')
    ),
    uniqueIndex('IX_event_organization_id_slug').on(
      table.organizationId,
      table.slug
    ),
    index('IX_event_start_date').using(
      'btree',
      table.startDate.asc().nullsLast()
    )
  ]
);

/** Alias para db.query.events */
export const events = eventTable;

/** Tipos de ingresso por evento (ex.: VIP, Geral, Meia). */
export const eventTicketTypeTable = pgTable(
  'event_ticket_type',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => eventTable.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    priceCents: integer('price_cents').notNull().default(0),
    quantityAvailable: integer('quantity_available'),
    saleStartsAt: timestamp('sale_starts_at', { withTimezone: true }),
    saleEndsAt: timestamp('sale_ends_at', { withTimezone: true }),
    isVisible: boolean('is_visible').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date())
  },
  (table) => [
    index('IX_event_ticket_type_event_id').using(
      'btree',
      table.eventId.asc().nullsLast().op('uuid_ops')
    )
  ]
);

/** Alias para query API */
export const eventTicketTypes = eventTicketTypeTable;

/** Inscrições em eventos. */
export const eventRegistrationTable = pgTable(
  'event_registration',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => eventTable.id, { onDelete: 'cascade' }),
    ticketTypeId: uuid('ticket_type_id').references(() => eventTicketTypeTable.id, {
      onDelete: 'set null'
    }),
    userId: uuid('user_id').references(() => userTable.id, { onDelete: 'set null' }),
    guestName: text('guest_name'),
    guestEmail: text('guest_email'),
    status: text('status', {
      enum: ['pending', 'confirmed', 'cancelled', 'waitlist']
    })
      .notNull()
      .default('pending'),
    paymentStatus: text('payment_status', {
      enum: ['pending', 'paid', 'refunded']
    })
      .default('pending'),
    externalPaymentId: text('external_payment_id'),
    registrationCode: text('registration_code'),
    checkedInAt: timestamp('checked_in_at', { withTimezone: true }),
    registrationData: jsonb('registration_data'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date())
  },
  (table) => [
    index('IX_event_registration_event_id').using(
      'btree',
      table.eventId.asc().nullsLast().op('uuid_ops')
    ),
    index('IX_event_registration_user_id').using(
      'btree',
      table.userId.asc().nullsLast().op('uuid_ops')
    ),
    index('IX_event_registration_guest_email').using(
      'btree',
      table.guestEmail.asc().nullsLast().op('text_ops')
    ),
    index('IX_event_registration_registration_code').using(
      'btree',
      table.registrationCode.asc().nullsLast().op('text_ops')
    )
  ]
);

/** Alias para db.query.eventRegistrations */
export const eventRegistrations = eventRegistrationTable;

// Relações
export const eventRelations = relations(eventTable, ({ many, one }) => ({
  registrations: many(eventRegistrationTable),
  ticketTypes: many(eventTicketTypeTable),
  organization: one(organizationTable, {
    fields: [eventTable.organizationId],
    references: [organizationTable.id]
  }),
  createdBy: one(userTable, {
    fields: [eventTable.createdById],
    references: [userTable.id]
  })
}));

export const eventTicketTypeRelations = relations(
  eventTicketTypeTable,
  ({ one, many }) => ({
    event: one(eventTable, {
      fields: [eventTicketTypeTable.eventId],
      references: [eventTable.id]
    }),
    registrations: many(eventRegistrationTable)
  })
);

export const eventRegistrationRelations = relations(
  eventRegistrationTable,
  ({ one }) => ({
    event: one(eventTable, {
      fields: [eventRegistrationTable.eventId],
      references: [eventTable.id]
    }),
    ticketType: one(eventTicketTypeTable, {
      fields: [eventRegistrationTable.ticketTypeId],
      references: [eventTicketTypeTable.id]
    }),
    user: one(userTable, {
      fields: [eventRegistrationTable.userId],
      references: [userTable.id]
    })
  })
);

// Schemas Zod (drizzle-zod)
export const insertEventSchema = createInsertSchema(eventTable).omit({
  id: true,
  organizationId: true,
  createdById: true,
  createdAt: true,
  updatedAt: true
});

export const insertEventTicketTypeSchema = createInsertSchema(
  eventTicketTypeTable
).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertEventRegistrationSchema = createInsertSchema(
  eventRegistrationTable
).omit({
  id: true,
  status: true,
  registrationCode: true,
  createdAt: true,
  updatedAt: true
});
