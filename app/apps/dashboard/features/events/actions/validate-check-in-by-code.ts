'use server';

import { authOrganizationActionClient } from '@/actions/safe-action';

import { ForbiddenError, NotFoundError } from '@workspace/common/errors';
import { db, eq, events } from '@workspace/database';

import { getRegistrationByCode } from '../data/get-registration-by-code';
import { checkInByCodeSchema } from '../schemas/check-in-by-code-schema';

export const validateCheckInByCode = authOrganizationActionClient
  .metadata({ actionName: 'validateCheckInByCode' })
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

    return {
      valid: true as const,
      eventId: registration.eventId,
      eventTitle: registration.eventTitle,
      name: registration.name || null,
      alreadyCheckedIn: registration.checkedInAt != null
    };
  });
