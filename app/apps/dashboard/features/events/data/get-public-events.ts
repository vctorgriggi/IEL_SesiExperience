import 'server-only';

import type { EventDto } from '@/features/events/types';

import {
  and,
  db,
  desc,
  eq,
  events,
  gte,
  ilike,
  lte,
  or
} from '@workspace/database';

export type GetPublicEventsFilters = {
  startDate?: Date;
  endDate?: Date;
  search?: string;
  limit?: number;
  offset?: number;
};

function buildPublicEventsWhere(filters?: GetPublicEventsFilters) {
  const conditions = [
    eq(events.status, 'published'),
    eq(events.isPublic, true)
  ];

  if (filters?.startDate) {
    conditions.push(gte(events.startDate, filters.startDate));
  }

  if (filters?.endDate) {
    conditions.push(lte(events.endDate, filters.endDate));
  }

  if (filters?.search?.trim()) {
    const pattern = `%${escapeLike(filters.search.trim())}%`;

    conditions.push(
      or(ilike(events.title, pattern), ilike(events.description, pattern))!
    );
  }

  return and(...conditions);
}

function escapeLike(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

function rowToEventDto(row: {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  startDate: Date;
  endDate: Date;
  location: string | null;
  imageUrl: string | null;
  ticketType: 'free' | 'paid';
  ticketPriceCents: number | null;
  latitude: number | null;
  longitude: number | null;
  maxAttendees: number | null;
  isPublic: boolean;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: { name: string | null } | null;
}): EventDto {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    startDate: row.startDate.toISOString(),
    endDate: row.endDate.toISOString(),
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
    ...(row.createdBy && {
      createdBy: { name: row.createdBy.name ?? undefined }
    })
  };
}
export async function getPublicEvents(
  filters?: GetPublicEventsFilters
): Promise<EventDto[]> {
  const limit = Math.min(filters?.limit ?? 50, 100);
  const offset = filters?.offset ?? 0;

  const rows = await db.query.events.findMany({
    where: buildPublicEventsWhere(filters),
    orderBy: [desc(events.startDate)],
    limit,
    offset,
    with: {
      createdBy: {
        columns: { name: true }
      }
    }
  });

  return rows.map(rowToEventDto);
}
