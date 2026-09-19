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

import { deleteTicketTypeSchema } from '../schemas/delete-ticket-type-schema';

export const deleteTicketType = authOrganizationActionClient
  .metadata({ actionName: 'deleteTicketType' })
  .inputSchema(deleteTicketTypeSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { eventId, ticketTypeId } = parsedInput;

    const [ticketType] = await db
      .select({ id: eventTicketTypeTable.id })
      .from(eventTicketTypeTable)
      .innerJoin(events, eq(events.id, eventTicketTypeTable.eventId))
      .where(
        and(
          eq(eventTicketTypeTable.id, ticketTypeId),
          eq(eventTicketTypeTable.eventId, eventId),
          eq(events.organizationId, ctx.organization.id),
          eq(events.createdById, ctx.session.user.id)
        )
      )
      .limit(1);

    if (!ticketType) {
      throw new NotFoundError(
        'Tipo de ingresso não encontrado ou você não tem permissão'
      );
    }

    const [deleted] = await db
      .delete(eventTicketTypeTable)
      .where(
        and(
          eq(eventTicketTypeTable.id, ticketTypeId),
          eq(eventTicketTypeTable.eventId, eventId)
        )
      )
      .returning({
        id: eventTicketTypeTable.id
      });

    if (!deleted) {
      throw new NotFoundError(
        'Tipo de ingresso não encontrado ou você não tem permissão'
      );
    }

    revalidatePath(
      routes.dashboard.org(ctx.organization.slug).events.byId(eventId).index
    );
    revalidatePath(
      routes.dashboard.org(ctx.organization.slug).events.byId(eventId).tickets
    );
    revalidatePath(getEventPath(eventId, ctx.organization.slug));
    revalidatePath(getEventTicketsPath(eventId, ctx.organization.slug));

    return { id: deleted.id };
  });
