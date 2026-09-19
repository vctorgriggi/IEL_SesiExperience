import 'server-only';

import type { EventDto } from '@/features/events/types';

import { and, db, eq, events } from '@workspace/database';

export async function getPublicEventBySlug(
  slug: string
): Promise<EventDto | null> {
  const [row] = await db.query.events.findMany({
    where: and(
      eq(events.slug, slug),
      eq(events.status, 'published'),
      eq(events.isPublic, true)
    ),
    limit: 1,
    with: {
      createdBy: {
        columns: { name: true }
      }
    }
  });
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    startDate:
      row.startDate instanceof Date
        ? row.startDate.toISOString()
        : String(row.startDate),
    endDate:
      row.endDate instanceof Date
        ? row.endDate.toISOString()
        : String(row.endDate),
    location: row.location,
    imageUrl: row.imageUrl ?? undefined,
    ticketType: row.ticketType ?? 'free',
    ticketPriceCents: row.ticketPriceCents ?? undefined,
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,
    maxAttendees: row.maxAttendees,
    isPublic: row.isPublic,
    status: row.status as EventDto['status'],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    ...(row.createdBy && { createdBy: { name: row.createdBy.name } })
  };
}
