'use server';

import { revalidatePath } from 'next/cache';
import { authOrganizationActionClient } from '@/actions/safe-action';

import { NotFoundError, PreConditionError } from '@workspace/common/errors';
import { and, db, eq, eventRegistrations, events } from '@workspace/database';
import { routes } from '@workspace/routes';

import { registrationByIdSchema } from '../schemas/registration-by-id-schema';

export const cancelEventRegistration = authOrganizationActionClient
  .metadata({ actionName: 'cancelEventRegistration' })
  .inputSchema(registrationByIdSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { registrationId } = parsedInput;

    const [registration] = await db
      .select({
        id: eventRegistrations.id,
        eventId: eventRegistrations.eventId,
        status: eventRegistrations.status
      })
      .from(eventRegistrations)
      .innerJoin(events, eq(events.id, eventRegistrations.eventId))
      .where(
        and(
          eq(eventRegistrations.id, registrationId),
          eq(events.organizationId, ctx.organization.id),
          eq(events.createdById, ctx.session.user.id)
        )
      )
      .limit(1);

    if (!registration) {
      throw new NotFoundError(
        'Inscrição não encontrada ou você não tem permissão'
      );
    }

    if (registration.status === 'cancelled') {
      return { success: true as const };
    }

    const [updated] = await db
      .update(eventRegistrations)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(eq(eventRegistrations.id, registrationId))
      .returning({ id: eventRegistrations.id });

    if (!updated) {
      throw new PreConditionError('Não foi possível cancelar a inscrição');
    }

    revalidatePath(
      routes.dashboard
        .org(ctx.organization.slug)
        .events.byId(registration.eventId).index
    );
    revalidatePath(
      routes.dashboard
        .org(ctx.organization.slug)
        .events.byId(registration.eventId).attendees
    );

    return { success: true as const };
  });
