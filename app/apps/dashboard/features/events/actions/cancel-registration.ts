'use server';

import { revalidatePath } from 'next/cache';
import { authActionClient } from '@/actions/safe-action';
import { getEventOrganizationSlug } from '@/features/events/data/get-event-organization-slug';

import { NotFoundError } from '@workspace/common/errors';
import { and, db, eq, eventRegistrations } from '@workspace/database';
import { routes } from '@workspace/routes';

import { cancelRegistrationSchema } from '../schemas/cancel-registration-schema';

export const cancelRegistration = authActionClient
  .metadata({ actionName: 'cancelRegistration' })
  .inputSchema(cancelRegistrationSchema)
  .action(async ({ parsedInput, ctx }) => {
    const user = ctx.session.user;
    const { eventId, registrationId } = parsedInput;
    const [cancelled] = await db
      .update(eventRegistrations)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(
        and(
          eq(eventRegistrations.id, registrationId),
          eq(eventRegistrations.eventId, eventId),
          eq(eventRegistrations.userId, user.id)
        )
      )
      .returning();
    if (!cancelled) {
      throw new NotFoundError(
        'Inscrição não encontrada ou você não tem permissão para cancelá-la'
      );
    }
    const slug = await getEventOrganizationSlug(eventId);
    if (slug) {
      revalidatePath(routes.dashboard.org(slug).events.byId(eventId).index);
      revalidatePath(routes.dashboard.org(slug).events.byId(eventId).attendees);
    }
  });
