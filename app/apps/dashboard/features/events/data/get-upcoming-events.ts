import 'server-only';

import type { UpcomingEventItem } from '@/features/events/types';

import { getAuthContext } from '@workspace/auth/context';
import {
  and,
  count,
  db,
  eq,
  eventRegistrations,
  events,
  eventTicketTypeTable,
  gte,
  inArray,
  membershipTable,
  organizationTable,
  sum
} from '@workspace/database';

export async function getUpcomingEvents(
  limit = 10,
  organizationSlug?: string | null
): Promise<UpcomingEventItem[]> {
  const { session } = await getAuthContext();
  const activeOrganizationSlug = organizationSlug ?? null;

  if (!activeOrganizationSlug) {
    return [];
  }

  const [organization] = await db
    .select({
      id: organizationTable.id
    })
    .from(organizationTable)
    .innerJoin(
      membershipTable,
      and(
        eq(membershipTable.organizationId, organizationTable.id),
        eq(membershipTable.userId, session.user.id)
      )
    )
    .where(eq(organizationTable.slug, activeOrganizationSlug))
    .limit(1);

  if (!organization) {
    return [];
  }

  const now = new Date();
  const upcomingRows = await db
    .select({
      id: events.id,
      name: events.title,
      date: events.startDate,
      status: events.status,
      capacity: events.maxAttendees
    })
    .from(events)
    .where(
      and(
        eq(events.organizationId, organization.id),
        eq(events.createdById, session.user.id),
        gte(events.startDate, now)
      )
    )
    .orderBy(events.startDate)
    .limit(limit);

  if (upcomingRows.length === 0) return [];

  const eventIds = upcomingRows.map((e) => e.id);
  const [registrationCounts, revenues] = await Promise.all([
    db
      .select({
        eventId: eventRegistrations.eventId,
        count: count()
      })
      .from(eventRegistrations)
      .where(
        and(
          inArray(eventRegistrations.eventId, eventIds),
          inArray(eventRegistrations.status, ['confirmed', 'pending'])
        )
      )
      .groupBy(eventRegistrations.eventId),
    db
      .select({
        eventId: eventRegistrations.eventId,
        total: sum(eventTicketTypeTable.priceCents)
      })
      .from(eventRegistrations)
      .innerJoin(
        eventTicketTypeTable,
        eq(eventTicketTypeTable.id, eventRegistrations.ticketTypeId)
      )
      .where(
        and(
          inArray(eventRegistrations.eventId, eventIds),
          eq(eventRegistrations.paymentStatus, 'paid')
        )
      )
      .groupBy(eventRegistrations.eventId)
  ]);

  const countMap = Object.fromEntries(
    registrationCounts.map((r) => [r.eventId, Number(r.count)])
  );
  const revenueMap = Object.fromEntries(
    revenues.map((r) => [r.eventId, Number(r.total ?? 0)])
  );

  return upcomingRows.map((event) => ({
    id: event.id,
    name: event.name,
    date:
      event.date instanceof Date
        ? event.date.toISOString()
        : String(event.date),
    registrations: countMap[event.id] ?? 0,
    capacity: event.capacity,
    revenue: revenueMap[event.id] ?? 0,
    status: event.status
  }));
}
