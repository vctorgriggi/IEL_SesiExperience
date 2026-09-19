'use server';

import { revalidatePath } from 'next/cache';
import { authOrganizationActionClient } from '@/actions/safe-action';
import {
  getEventPath,
  getEventTicketsPath
} from '@/features/events/routing/event-navigation';

import { NotFoundError } from '@workspace/common/errors';
import { and, db, eq, events, eventTicketTypeTable } from '@workspace/database';
import { routes } from '@workspace/routes';

import { createTicketTypeSchema } from '../schemas/create-ticket-type-schema';

export const createTicketType = authOrganizationActionClient
  .metadata({ actionName: 'createTicketType' })
  .inputSchema(createTicketTypeSchema)
  .action(async ({ parsedInput, ctx }) => {
    const org = ctx.organization;
    const {
      eventId,
      name,
      priceCents,
      quantityAvailable,
      saleStartsAt,
      saleEndsAt,
      isVisible
    } = parsedInput;

    const [event] = await db
      .select({ id: events.id })
      .from(events)
      .where(
        and(
          eq(events.id, eventId),
          eq(events.organizationId, org.id),
          eq(events.createdById, ctx.session.user.id)
        )
      )
      .limit(1);
    if (!event) {
      throw new NotFoundError('Event not found or you do not have permission');
    }

    const [inserted] = await db
      .insert(eventTicketTypeTable)
      .values({
        eventId,
        name,
        priceCents,
        quantityAvailable: quantityAvailable ?? null,
        saleStartsAt: saleStartsAt ?? null,
        saleEndsAt: saleEndsAt ?? null,
        isVisible: isVisible ?? true
      })
      .returning();

    if (!inserted) {
      throw new NotFoundError('Failed to create ticket type');
    }

    revalidatePath(routes.dashboard.org(org.slug).events.byId(eventId).index);
    revalidatePath(routes.dashboard.org(org.slug).events.byId(eventId).tickets);
    revalidatePath(getEventPath(eventId, org.slug));
    revalidatePath(getEventTicketsPath(eventId, org.slug));

    return {
      id: inserted.id,
      name: inserted.name,
      priceCents: inserted.priceCents
    };
  });
