'use server';

import { revalidatePath } from 'next/cache';
import { authOrganizationActionClient } from '@/actions/safe-action';
import { getCurrentMembership } from '@/features/members/data/get-current-membership';
import { can } from '@/features/members/permissions';

import { ForbiddenError, NotFoundError } from '@workspace/common/errors';
import {
  and,
  db,
  eq,
  InvitationStatus,
  invitationTable
} from '@workspace/database';
import { routes } from '@workspace/routes';

import { invitationIdSchema } from '../schemas/invitation-id-schema';

export const revokeInvitation = authOrganizationActionClient
  .metadata({ actionName: 'revokeInvitation' })
  .inputSchema(invitationIdSchema)
  .action(async ({ parsedInput, ctx }) => {
    const membership = await getCurrentMembership();
    if (!can(membership).inviteMembers) {
      throw new ForbiddenError(
        'Apenas administradores podem revogar convites.'
      );
    }

    const org = ctx.organization;

    const [invitation] = await db
      .select()
      .from(invitationTable)
      .where(
        and(
          eq(invitationTable.id, parsedInput.invitationId),
          eq(invitationTable.organizationId, org.id)
        )
      )
      .limit(1);

    if (!invitation) {
      throw new NotFoundError('Convite não encontrado.');
    }

    await db
      .update(invitationTable)
      .set({ status: InvitationStatus.REVOKED })
      .where(
        and(
          eq(invitationTable.id, parsedInput.invitationId),
          eq(invitationTable.organizationId, org.id)
        )
      );

    revalidatePath(routes.dashboard.org(org.slug).settings.members);
  });
