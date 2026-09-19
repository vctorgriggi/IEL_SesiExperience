import 'server-only';

import type { ParticipantListItemDto } from '@/features/events/types';

import { getAuthOrganizationContext } from '@workspace/auth/context';
import {
  and,
  count,
  db,
  eq,
  eventRegistrations,
  events,
  isNotNull,
  userTable
} from '@workspace/database';

const eventRegistrationStatusValues = [
  'pending',
  'confirmed',
  'cancelled',
  'waitlist'
] as const;

export type GetEventParticipantsOptions = {
  status?: (typeof eventRegistrationStatusValues)[number] | 'checked-in';
  limit?: number;
  offset?: number;
};

export async function getEventParticipants(
  eventId: string,
  options?: GetEventParticipantsOptions
): Promise<{ items: ParticipantListItemDto[]; total: number }> {
  const ctx = await getAuthOrganizationContext();
  const limit = Math.min(options?.limit ?? 50, 100);
  const offset = options?.offset ?? 0;

  let whereClause = and(
    eq(events.organizationId, ctx.organization.id),
    eq(events.createdById, ctx.session.user.id),
    eq(eventRegistrations.eventId, eventId)
  );
  if (options?.status === 'checked-in') {
    whereClause = and(whereClause, isNotNull(eventRegistrations.checkedInAt));
  } else if (
    options?.status &&
    eventRegistrationStatusValues.includes(options.status)
  ) {
    whereClause = and(
      whereClause,
      eq(eventRegistrations.status, options.status)
    );
  }

  const [items, totalResult] = await Promise.all([
    db
      .select({
        id: eventRegistrations.id,
        eventId: eventRegistrations.eventId,
        eventTitle: events.title,
        userName: userTable.name,
        userEmail: userTable.email,
        guestName: eventRegistrations.guestName,
        guestEmail: eventRegistrations.guestEmail,
        status: eventRegistrations.status,
        checkedInAt: eventRegistrations.checkedInAt,
        createdAt: eventRegistrations.createdAt
      })
      .from(eventRegistrations)
      .innerJoin(events, eq(events.id, eventRegistrations.eventId))
      .leftJoin(userTable, eq(userTable.id, eventRegistrations.userId))
      .where(whereClause)
      .orderBy(eventRegistrations.createdAt)
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(eventRegistrations)
      .innerJoin(events, eq(events.id, eventRegistrations.eventId))
      .where(whereClause)
  ]);

  const total = Number(totalResult[0]?.count ?? 0);
  return {
    items: items.map((row) => {
      const name = row.userName ?? row.guestName ?? '';
      const email = row.userEmail ?? row.guestEmail ?? null;
      const status = row.checkedInAt != null ? 'checked-in' : row.status;
      return {
        id: row.id,
        eventId: row.eventId,
        eventTitle: row.eventTitle,
        name,
        email,
        status,
        checkedInAt: row.checkedInAt?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString()
      };
    }),
    total
  };
}
