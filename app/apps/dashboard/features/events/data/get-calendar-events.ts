import 'server-only';

import { getAuthOrganizationContext } from '@workspace/auth/context';
import { and, db, eq, events, gte, lt } from '@workspace/database';

export type CalendarEventItem = {
  id: string;
  name: string;
  date: string;
  status: string;
  color: string;
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'hsl(215 16% 47%)',
  published: 'hsl(217 91% 60%)',
  completed: 'hsl(142 71% 45%)',
  cancelled: 'hsl(0 84% 60%)'
};

function getColorForStatus(status: string): string {
  return STATUS_COLORS[status] ?? 'hsl(215 16% 47%)';
}

export async function getCalendarEvents(
  month: string
): Promise<CalendarEventItem[]> {
  const ctx = await getAuthOrganizationContext();
  const [y, m] = month.split('-').map(Number);
  const monthStart = new Date(Date.UTC(y, m - 1, 1));
  const monthEnd = new Date(Date.UTC(y, m, 1));
  const rows = await db
    .select({
      id: events.id,
      name: events.title,
      startDate: events.startDate,
      status: events.status
    })
    .from(events)
    .where(
      and(
        eq(events.organizationId, ctx.organization.id),
        eq(events.createdById, ctx.session.user.id),
        gte(events.startDate, monthStart),
        lt(events.startDate, monthEnd)
      )
    )
    .orderBy(events.startDate);
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    date:
      r.startDate instanceof Date
        ? r.startDate.toISOString()
        : String(r.startDate),
    status: r.status,
    color: getColorForStatus(r.status)
  }));
}
