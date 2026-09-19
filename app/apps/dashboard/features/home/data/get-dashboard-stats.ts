import 'server-only';

import type { DashboardStats } from '@/features/home/types';

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
  isNotNull,
  lt,
  or,
  sql
} from '@workspace/database';

import { getActiveOrganization } from './get-active-organization';

const DEFAULT_DASHBOARD_STATS: DashboardStats = {
  totalEvents: 0,
  activeEvents: 0,
  endedEvents: 0,
  totalRegistrations: 0,
  totalRevenue: 0,
  checkinRate: 0
};

export async function getDashboardStats(
  periodDays: number,
  organizationSlug?: string | null
): Promise<DashboardStats> {
  const organization = await getActiveOrganization(organizationSlug);

  if (!organization) {
    return DEFAULT_DASHBOARD_STATS;
  }

  const now = new Date();
  const periodStart = new Date(now);
  periodStart.setDate(periodStart.getDate() - Math.max(periodDays - 1, 0));
  periodStart.setHours(0, 0, 0, 0);

  const [
    totalEventsResult,
    activeEventsResult,
    endedEventsResult,
    registrationStats
  ] = await Promise.all([
    db
      .select({ count: count() })
      .from(events)
      .where(eq(events.organizationId, organization.id)),
    db
      .select({ count: count() })
      .from(events)
      .where(
        and(
          eq(events.organizationId, organization.id),
          eq(events.status, 'published'),
          gte(events.endDate, now)
        )
      ),
    db
      .select({ count: count() })
      .from(events)
      .where(
        and(
          eq(events.organizationId, organization.id),
          or(eq(events.status, 'completed'), lt(events.endDate, now))
        )
      ),
    db
      .select({
        totalRegistrations: sql<number>`count(*) filter (where ${eventRegistrations.status} in ('confirmed', 'pending'))::int`,
        checkedInCount: sql<number>`count(*) filter (where ${eventRegistrations.status} in ('confirmed', 'pending') and ${eventRegistrations.checkedInAt} is not null)::int`,
        totalRevenue: sql<number>`coalesce(sum(${eventTicketTypeTable.priceCents}) filter (where ${eventRegistrations.paymentStatus} = 'paid'), 0)::int`
      })
      .from(eventRegistrations)
      .innerJoin(events, eq(events.id, eventRegistrations.eventId))
      .leftJoin(
        eventTicketTypeTable,
        eq(eventTicketTypeTable.id, eventRegistrations.ticketTypeId)
      )
      .where(
        and(
          eq(events.organizationId, organization.id),
          gte(eventRegistrations.createdAt, periodStart),
          or(
            inArray(eventRegistrations.status, ['confirmed', 'pending']),
            eq(eventRegistrations.paymentStatus, 'paid'),
            isNotNull(eventRegistrations.checkedInAt)
          )
        )
      )
  ]);

  const totalEvents = Number(totalEventsResult[0]?.count ?? 0);
  const activeEvents = Number(activeEventsResult[0]?.count ?? 0);
  const endedEvents = Number(endedEventsResult[0]?.count ?? 0);
  const registrationData = registrationStats[0];
  const totalRegistrations = Number(registrationData?.totalRegistrations ?? 0);
  const checkedInCount = Number(registrationData?.checkedInCount ?? 0);

  return {
    totalEvents,
    activeEvents,
    endedEvents,
    totalRegistrations,
    totalRevenue: Number(registrationData?.totalRevenue ?? 0),
    checkinRate:
      totalRegistrations > 0
        ? Math.round((checkedInCount / totalRegistrations) * 100)
        : 0
  };
}
