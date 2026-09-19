'use server';

import { revalidatePath } from 'next/cache';
import { authOrganizationActionClient } from '@/actions/safe-action';
import { getCurrentMembership } from '@/features/members/data/get-current-membership';
import { can } from '@/features/members/permissions';

import { ForbiddenError, NotFoundError } from '@workspace/common/errors';
import { and, db, eq, events } from '@workspace/database';
import { routes } from '@workspace/routes';

import { deleteEventSchema } from '../schemas/delete-event-schema';

export const deleteEvent = authOrganizationActionClient
  .metadata({ actionName: 'deleteEvent' })
  .inputSchema(deleteEventSchema)
  .action(async ({ parsedInput, ctx }) => {
    const org = ctx.organization;
    const user = ctx.session.user;
    const { id } = parsedInput;
    const [existing] = await db
      .select({ createdById: events.createdById })
      .from(events)
      .where(and(eq(events.id, id), eq(events.organizationId, org.id)))
      .limit(1);
    if (!existing) {
      throw new NotFoundError('Evento não encontrado');
    }
    const isCreator = existing.createdById === user.id;
    if (!isCreator) {
      const membership = await getCurrentMembership();
      if (!can(membership).updateOrgSettings) {
        throw new ForbiddenError(
          'Apenas o criador do evento ou um administrador podem removê-lo.'
        );
      }
    }
    const [deleted] = await db
      .delete(events)
      .where(and(eq(events.id, id), eq(events.organizationId, org.id)))
      .returning();
    if (!deleted) {
      throw new NotFoundError('Evento não encontrado');
    }
    revalidatePath(routes.dashboard.org(org.slug).events.index);
    revalidatePath(routes.dashboard.org(org.slug).events.byId(id).index);
  });
