'use server';

import { revalidatePath } from 'next/cache';
import { authOrganizationActionClient } from '@/actions/safe-action';

import { ForbiddenError } from '@workspace/common/errors';
import { db, events } from '@workspace/database';
import { routes } from '@workspace/routes';

import { createEventSchema } from '../schemas/create-event-schema';

export const createEvent = authOrganizationActionClient
  .metadata({ actionName: 'createEvent' })
  .inputSchema(createEventSchema)
  .action(async ({ parsedInput, ctx }) => {
    const org = ctx.organization;
    const user = ctx.session.user;
    const body = parsedInput;

    const [event] = await db
      .insert(events)
      .values({
        title: body.title,
        description: body.description ?? null,
        startDate:
          body.startDate instanceof Date
            ? body.startDate
            : new Date(body.startDate),
        endDate:
          body.endDate instanceof Date ? body.endDate : new Date(body.endDate),
        location: body.location ?? null,
        imageUrl: body.imageUrl ?? null,
        ticketType: body.ticketType ?? 'free',
        ticketPriceCents: body.ticketPriceCents ?? null,
        latitude: body.latitude ?? null,
        longitude: body.longitude ?? null,
        maxAttendees: body.maxAttendees ?? null,
        isPublic: body.isPublic ?? false,
        status: body.status ?? 'draft',
        metadata: body.metadata ?? null,
        organizationId: org.id,
        createdById: user.id
      })
      .returning();

    if (!event) {
      throw new ForbiddenError('Failed to create event');
    }

    revalidatePath(routes.dashboard.org(org.slug).events.index);
    revalidatePath(routes.dashboard.org(org.slug).events.create);

    return { id: event.id, slug: event.slug };
  });
