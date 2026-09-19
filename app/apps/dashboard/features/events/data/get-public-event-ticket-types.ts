import 'server-only';

import { and, db, eq, events, eventTicketTypeTable } from '@workspace/database';

export type PublicEventTicketTypeItem = {
  id: string;
  name: string;
  priceCents: number;
  quantityAvailable: number | null;
  isVisible: boolean;
};

export async function getPublicEventTicketTypes(
  slug: string
): Promise<PublicEventTicketTypeItem[]> {
  const rows = await db
    .select({
      id: eventTicketTypeTable.id,
      name: eventTicketTypeTable.name,
      priceCents: eventTicketTypeTable.priceCents,
      quantityAvailable: eventTicketTypeTable.quantityAvailable,
      isVisible: eventTicketTypeTable.isVisible
    })
    .from(eventTicketTypeTable)
    .innerJoin(events, eq(events.id, eventTicketTypeTable.eventId))
    .where(
      and(
        eq(events.slug, slug),
        eq(events.status, 'published'),
        eq(eventTicketTypeTable.isVisible, true)
      )
    );
  return rows;
}
