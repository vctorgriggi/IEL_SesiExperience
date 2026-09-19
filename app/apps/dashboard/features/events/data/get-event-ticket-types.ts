import 'server-only';

import { getAuthOrganizationContext } from '@workspace/auth/context';
import { and, db, eq, events, eventTicketTypeTable } from '@workspace/database';

export type EventTicketTypeItem = {
  id: string;
  eventId: string;
  name: string;
  priceCents: number;
  quantityAvailable: number | null;
  saleStartsAt: string | null;
  saleEndsAt: string | null;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
};

export async function getEventTicketTypes(
  eventId: string
): Promise<EventTicketTypeItem[]> {
  const ctx = await getAuthOrganizationContext();
  const rows = await db
    .select()
    .from(eventTicketTypeTable)
    .innerJoin(events, eq(events.id, eventTicketTypeTable.eventId))
    .where(
      and(
        eq(eventTicketTypeTable.eventId, eventId),
        eq(events.organizationId, ctx.organization.id),
        eq(events.createdById, ctx.session.user.id)
      )
    );
  return rows.map((r) => {
    const t = r.event_ticket_type;
    return {
      id: t.id,
      eventId: t.eventId,
      name: t.name,
      priceCents: t.priceCents,
      quantityAvailable: t.quantityAvailable,
      saleStartsAt: t.saleStartsAt?.toISOString() ?? null,
      saleEndsAt: t.saleEndsAt?.toISOString() ?? null,
      isVisible: t.isVisible,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString()
    };
  });
}
