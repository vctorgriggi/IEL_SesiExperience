'use server';

import { revalidatePath } from 'next/cache';
import { authOrganizationActionClient } from '@/actions/safe-action';

import { NotFoundError, PreConditionError } from '@workspace/common/errors';
import {
  and,
  db,
  eq,
  eventRegistrations,
  events,
  isNull
} from '@workspace/database';
import { routes } from '@workspace/routes';

import { registrationByIdSchema } from '../schemas/registration-by-id-schema';

export const checkInEventRegistration = authOrganizationActionClient
  .metadata({ actionName: 'checkInEventRegistration' })
  .inputSchema(registrationByIdSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { registrationId } = parsedInput;

    const [registration] = await db
      .select({
        id: eventRegistrations.id,
        eventId: eventRegistrations.eventId,
        status: eventRegistrations.status,
        checkedInAt: eventRegistrations.checkedInAt
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
      throw new PreConditionError(
        'Não é possível fazer check-in: inscrição cancelada'
      );
    }

    if (registration.checkedInAt) {
      return {
        success: true as const,
        checkedInAt: registration.checkedInAt.toISOString()
      };
    }

    const now = new Date();
    const [updated] = await db
      .update(eventRegistrations)
      .set({ checkedInAt: now, updatedAt: now })
      .where(
        and(
          eq(eventRegistrations.id, registrationId),
          isNull(eventRegistrations.checkedInAt)
        )
      )
      .returning({ checkedInAt: eventRegistrations.checkedInAt });

    const checkedInAt =
      updated?.checkedInAt?.toISOString() ?? now.toISOString();

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

    return { success: true as const, checkedInAt };
  });
