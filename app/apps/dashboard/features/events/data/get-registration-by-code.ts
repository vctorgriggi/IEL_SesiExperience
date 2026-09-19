import 'server-only';

import {
  db,
  eq,
  eventRegistrations,
  events,
  eventTicketTypeTable
} from '@workspace/database';

export type RegistrationByCode = {
  id: string;
  registrationCode: string;
  eventId: string;
  eventTitle: string;
  eventSlug: string;
  ticketTypeName: string | null;
  name: string;
  email: string | null;
  status: string;
  paymentStatus: string | null;
  checkedInAt: string | null;
  createdAt: string;
};

export async function getRegistrationByCode(
  code: string
): Promise<RegistrationByCode | null> {
  const [row] = await db
    .select({
      id: eventRegistrations.id,
      registrationCode: eventRegistrations.registrationCode,
      eventId: eventRegistrations.eventId,
      eventTitle: events.title,
      eventSlug: events.slug,
      ticketTypeName: eventTicketTypeTable.name,
      guestName: eventRegistrations.guestName,
      guestEmail: eventRegistrations.guestEmail,
      status: eventRegistrations.status,
      paymentStatus: eventRegistrations.paymentStatus,
      checkedInAt: eventRegistrations.checkedInAt,
      createdAt: eventRegistrations.createdAt
    })
    .from(eventRegistrations)
    .innerJoin(events, eq(events.id, eventRegistrations.eventId))
    .leftJoin(
      eventTicketTypeTable,
      eq(eventTicketTypeTable.id, eventRegistrations.ticketTypeId)
    )
    .where(eq(eventRegistrations.registrationCode, code))
    .limit(1);
  if (!row) return null;
  const name = row.guestName ?? '';
  return {
    id: row.id,
    registrationCode: row.registrationCode ?? '',
    eventId: row.eventId,
    eventTitle: row.eventTitle,
    eventSlug: row.eventSlug,
    ticketTypeName: row.ticketTypeName,
    name,
    email: row.guestEmail,
    status: row.status,
    paymentStatus: row.paymentStatus,
    checkedInAt: row.checkedInAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString()
  };
}
