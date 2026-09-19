import 'server-only';

import type { ChartRegistrationsPoint } from '@/features/home/types';

import {
  and,
  db,
  eq,
  eventRegistrations,
  events,
  gte,
  sql
} from '@workspace/database';

import { getActiveOrganization } from './get-active-organization';

function toChartDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function buildDateRange(periodDays: number): string[] {
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - Math.max(periodDays - 1, 0));
  start.setHours(0, 0, 0, 0);

  const dates: string[] = [];
  for (
    let cursor = new Date(start);
    cursor <= today;
    cursor.setDate(cursor.getDate() + 1)
  ) {
    dates.push(toChartDate(new Date(cursor)));
  }

  return dates;
}

export async function getChartRegistrations(
  periodDays: number,
  organizationSlug?: string | null
): Promise<ChartRegistrationsPoint[]> {
  const organization = await getActiveOrganization(organizationSlug);

  if (!organization) {
    return [];
  }

  const periodStart = new Date();
  periodStart.setDate(periodStart.getDate() - Math.max(periodDays - 1, 0));
  periodStart.setHours(0, 0, 0, 0);

  const rows = await db
    .select({
      date: sql<string>`to_char((${eventRegistrations.createdAt} at time zone 'UTC')::date, 'YYYY-MM-DD')`,
      count: sql<number>`count(*)::int`
    })
    .from(eventRegistrations)
    .innerJoin(events, eq(events.id, eventRegistrations.eventId))
    .where(
      and(
        eq(events.organizationId, organization.id),
        gte(eventRegistrations.createdAt, periodStart),
        eq(eventRegistrations.status, 'confirmed')
      )
    )
    .groupBy(sql`(${eventRegistrations.createdAt} at time zone 'UTC')::date`);

  const countsByDate = new Map<string, number>(
    rows.map((row) => [row.date, Number(row.count ?? 0)])
  );

  return buildDateRange(periodDays).map((date) => ({
    date,
    count: countsByDate.get(date) ?? 0
  }));
}
