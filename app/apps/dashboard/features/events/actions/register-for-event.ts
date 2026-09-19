'use server';

import { revalidatePath } from 'next/cache';
import { authActionClient } from '@/actions/safe-action';
import { getEventOrganizationSlug } from '@/features/events/data/get-event-organization-slug';

import { NotFoundError, PreConditionError } from '@workspace/common/errors';
import {
  and,
  count,
  db,
  eq,
  eventRegistrations,
  events
} from '@workspace/database';
import { routes } from '@workspace/routes';

import { registerForEventSchema } from '../schemas/register-for-event-schema';

export const registerForEvent = authActionClient
  .metadata({ actionName: 'registerForEvent' })
  .inputSchema(registerForEventSchema)
  .action(async ({ parsedInput, ctx }) => {
    const user = ctx.session.user;
    const {
      eventId,
      name: bodyName,
      email: bodyEmail,
      registrationData
    } = parsedInput;

    const [event] = await db
      .select({
        id: events.id,
        status: events.status,
        isPublic: events.isPublic,
        maxAttendees: events.maxAttendees
      })
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);
    if (!event) {
      throw new NotFoundError('Event not found');
    }
    if (event.status !== 'published') {
      throw new PreConditionError('Event is not available for registrations');
    }
    if (!event.isPublic) {
      throw new PreConditionError('Event is not public');
    }

    const [existing] = await db.query.eventRegistrations.findMany({
      where: and(
        eq(eventRegistrations.eventId, eventId),
        eq(eventRegistrations.userId, user.id)
      ),
      limit: 1
    });
    if (existing) {
      throw new PreConditionError('You are already registered for this event');
    }

    const [countRow] = await db
      .select({ count: count() })
      .from(eventRegistrations)
      .where(
        and(
          eq(eventRegistrations.eventId, eventId),
          eq(eventRegistrations.status, 'confirmed')
        )
      );
    const confirmedCount = Number(countRow?.count ?? 0);
    if (
      event.maxAttendees != null &&
      typeof event.maxAttendees === 'number' &&
      confirmedCount >= event.maxAttendees
    ) {
      throw new PreConditionError('Evento esgotado');
    }

    const guestName = bodyName?.trim() ?? user.name ?? null;
    const guestEmail = bodyEmail?.trim() ?? user.email ?? null;
    const status = event.maxAttendees ? 'confirmed' : 'pending';

    const [registration] = await db
      .insert(eventRegistrations)
      .values({
        eventId,
        userId: user.id,
        guestName,
        guestEmail,
        registrationData: registrationData ?? {},
        status
      })
      .returning();

    const slug = await getEventOrganizationSlug(eventId);
    if (slug) {
      revalidatePath(routes.dashboard.org(slug).events.byId(eventId).index);
    }

    return { registrationId: registration?.id ?? '' };
  });
