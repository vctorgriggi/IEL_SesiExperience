import 'server-only';

import { db, eq, events, organizationTable } from '@workspace/database';

export async function getEventOrganizationSlug(
  eventId: string
): Promise<string | null> {
  const [row] = await db
    .select({ slug: organizationTable.slug })
    .from(events)
    .innerJoin(
      organizationTable,
      eq(events.organizationId, organizationTable.id)
    )
    .where(eq(events.id, eventId))
    .limit(1);

  return row?.slug ?? null;
}
