import 'server-only';

import { getAuthOrganizationContext } from '@workspace/auth/context';
import {
  and,
  db,
  eq,
  eventRegistrations,
  events,
  isNotNull,
  sql
} from '@workspace/database';

export type LocationEventItem = {
  id: string;
  name: string;
  date: string;
  lat: number | null;
  lng: number | null;
  registrations: number;
};

export async function getEventsLocations(): Promise<LocationEventItem[]> {
  const ctx = await getAuthOrganizationContext();
  const rows = await db
    .select({
      id: events.id,
      name: events.title,
      startDate: events.startDate,
      lat: events.latitude,
      lng: events.longitude,
      registrations: sql<number>`count(*) filter (where ${eventRegistrations.status} = 'confirmed')::int`
    })
    .from(events)
    .leftJoin(eventRegistrations, eq(eventRegistrations.eventId, events.id))
    .where(
      and(
        eq(events.organizationId, ctx.organization.id),
        eq(events.createdById, ctx.session.user.id),
        isNotNull(events.latitude),
        isNotNull(events.longitude)
      )
    )
    .groupBy(
      events.id,
      events.title,
      events.startDate,
      events.latitude,
      events.longitude
    )
    .orderBy(events.startDate);

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    date:
      r.startDate instanceof Date
        ? r.startDate.toISOString()
        : String(r.startDate),
    lat: r.lat,
    lng: r.lng,
    registrations: Number(r.registrations ?? 0)
  }));
}
