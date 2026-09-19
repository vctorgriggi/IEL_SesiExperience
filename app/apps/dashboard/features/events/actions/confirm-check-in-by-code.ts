'use server';

import { authOrganizationActionClient } from '@/actions/safe-action';

import {
  ForbiddenError,
  NotFoundError,
  PreConditionError
} from '@workspace/common/errors';
import { db, eq, eventRegistrations, events } from '@workspace/database';

import { getRegistrationByCode } from '../data/get-registration-by-code';
import { checkInByCodeSchema } from '../schemas/check-in-by-code-schema';

export const confirmCheckInByCode = authOrganizationActionClient
  .metadata({ actionName: 'confirmCheckInByCode' })
  .inputSchema(checkInByCodeSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { code } = parsedInput;
    const registration = await getRegistrationByCode(code);
    if (!registration) {
      throw new NotFoundError('Código de ingresso não encontrado');
    }

    const [eventRow] = await db
      .select({ organizationId: events.organizationId })
      .from(events)
      .where(eq(events.id, registration.eventId))
      .limit(1);
    if (!eventRow || eventRow.organizationId !== ctx.organization.id) {
      throw new ForbiddenError(
        'Este ingresso não pertence a um evento da sua organização'
      );
    }

    if (registration.checkedInAt != null) {
      throw new PreConditionError('Este participante já fez check-in');
    }

    const [updated] = await db
      .update(eventRegistrations)
      .set({ checkedInAt: new Date() })
      .where(eq(eventRegistrations.registrationCode, code))
      .returning({ checkedInAt: eventRegistrations.checkedInAt });

    const checkedInAt =
      updated?.checkedInAt?.toISOString() ?? new Date().toISOString();
    return { success: true as const, checkedInAt };
  });
