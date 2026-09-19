import 'server-only';

import type {
  EventRegistrationDto,
  EventWithRegistrationsDto
} from '@/features/events/types';

import { getAuthOrganizationContext } from '@workspace/auth/context';
import { and, db, eq, events } from '@workspace/database';

function mapRegistration(r: {
  id: string;
  eventId: string;
  userId: string | null;
  guestName: string | null;
  guestEmail: string | null;
  status: string;
  registrationData: unknown;
  createdAt: Date;
  updatedAt: Date;
  user?: { name: string | null; email: string | null } | null;
}): EventRegistrationDto {
  const name = r.user?.name ?? r.guestName ?? null;
  const email = r.user?.email ?? r.guestEmail ?? null;
  return {
    id: r.id,
    eventId: r.eventId,
    userId: r.userId,
    guestName: r.guestName,
    guestEmail: r.guestEmail,
    status: r.status as EventRegistrationDto['status'],
    registrationData: r.registrationData,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    ...(name != null || email != null
      ? { user: { name: name ?? undefined, email: email ?? undefined } }
      : {})
  };
}

export async function getEventById(
  id: string
): Promise<EventWithRegistrationsDto | null> {
  const ctx = await getAuthOrganizationContext();
  const [row] = await db.query.events.findMany({
    where: and(
      eq(events.id, id),
      eq(events.organizationId, ctx.organization.id),
      eq(events.createdById, ctx.session.user.id)
    ),
    limit: 1,
    with: {
      createdBy: {
        columns: { id: true, name: true, email: true }
      },
      registrations: {
        with: {
          user: {
            columns: { id: true, name: true, email: true }
          }
        }
      }
    }
  });
  if (!row) return null;
  const registrations: EventRegistrationDto[] = (row.registrations ?? []).map(
    (r) => mapRegistration(r)
  );
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
    status: row.status as EventWithRegistrationsDto['status'],
    organizationId: row.organizationId,
    createdById: row.createdById,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    ...(row.createdBy && { createdBy: { name: row.createdBy.name } }),
    registrations
  };
}
