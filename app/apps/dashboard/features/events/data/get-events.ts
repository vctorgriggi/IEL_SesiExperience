import 'server-only';

import type { EventDto } from '@/features/events/types';
import type { EventStatusFilter } from '@/features/events/utils/events-filters';

import { getAuthOrganizationContext } from '@workspace/auth/context';
import {
  and,
  count,
  db,
  desc,
  eq,
  events,
  gte,
  ilike,
  lte,
  or
} from '@workspace/database';

export type GetEventsFilters = {
  status?: EventStatusFilter;
  search?: string;
  startDate?: Date;
  endDate?: Date;
  isPublic?: boolean;
};

function escapeLike(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

function buildEventsWhere(
  organizationId: string,
  createdById: string,
  filters?: GetEventsFilters
) {
  const search = filters?.search?.trim();
  const pattern = search ? `%${escapeLike(search)}%` : null;

  return and(
    eq(events.organizationId, organizationId),
    eq(events.createdById, createdById),
    filters?.status ? eq(events.status, filters.status) : undefined,
    filters?.startDate ? gte(events.startDate, filters.startDate) : undefined,
    filters?.endDate ? lte(events.endDate, filters.endDate) : undefined,
    filters?.isPublic !== undefined
      ? eq(events.isPublic, filters.isPublic)
      : undefined,
    pattern
      ? or(ilike(events.title, pattern), ilike(events.description, pattern))
      : undefined
  );
}

type EventRow = typeof events.$inferSelect & {
  createdBy?: { name: string | null } | null;
};

function rowToEventDto(row: EventRow): EventDto {
  return {
    ...row,
    startDate: row.startDate.toISOString(),
    endDate: row.endDate.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    status: row.status as EventDto['status'],
    createdBy: row.createdBy
      ? { name: row.createdBy.name ?? undefined }
      : undefined
  };
}

export async function getEventsPaginated(
  filters: GetEventsFilters | undefined,
  page = 1,
  pageSize = 10
): Promise<{ events: EventDto[]; total: number }> {
  const ctx = await getAuthOrganizationContext();
  const offset = (page - 1) * pageSize;

  const whereClause = buildEventsWhere(
    ctx.organization.id,
    ctx.session.user.id,
    filters
  );

  const [rows, countRows] = await Promise.all([
    db.query.events.findMany({
      where: whereClause,
      orderBy: [desc(events.createdAt)],
      limit: 10,
      offset,
      with: { createdBy: { columns: { name: true } } }
    }),
    db.select({ count: count() }).from(events).where(whereClause)
  ]);

  return {
    events: rows.map(rowToEventDto),
    total: Number(countRows[0]?.count ?? 0)
  };
}

export async function getEvents(
  filters?: GetEventsFilters
): Promise<EventDto[]> {
  const { events: rows } = await getEventsPaginated(filters, 1, 10);
  return rows;
}
