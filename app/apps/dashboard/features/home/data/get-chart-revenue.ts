import 'server-only';

import type { ChartRevenuePoint } from '@/features/home/types';

import {
  and,
  db,
  eq,
  eventRegistrations,
  events,
  eventTicketTypeTable,
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

export async function getChartRevenue(
  periodDays: number,
  organizationSlug?: string | null
): Promise<ChartRevenuePoint[]> {
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
      amount: sql<number>`coalesce(sum(${eventTicketTypeTable.priceCents}), 0)::int`
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
        eq(eventRegistrations.paymentStatus, 'paid')
      )
    )
    .groupBy(sql`(${eventRegistrations.createdAt} at time zone 'UTC')::date`);

  const revenueByDate = new Map<string, number>(
    rows.map((row) => [row.date, Number(row.amount ?? 0)])
  );

  return buildDateRange(periodDays).map((date) => ({
    date,
    amount: revenueByDate.get(date) ?? 0
  }));
}
