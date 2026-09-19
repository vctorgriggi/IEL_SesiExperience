'use server';

import { revalidatePath } from 'next/cache';
import { authOrganizationActionClient } from '@/actions/safe-action';
import { getCurrentMembership } from '@/features/members/data/get-current-membership';
import { can } from '@/features/members/permissions';

import { sendInvitationRequest } from '@workspace/auth/invitations';
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

export const resendInvitation = authOrganizationActionClient
  .metadata({ actionName: 'resendInvitation' })
  .inputSchema(invitationIdSchema)
  .action(async ({ parsedInput, ctx }) => {
    const membership = await getCurrentMembership();
    if (!can(membership).inviteMembers) {
      throw new ForbiddenError(
        'Apenas administradores podem reenviar convites.'
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
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new ForbiddenError('Só é possível reenviar convites pendentes.');
    }

    await sendInvitationRequest({
      email: invitation.email,
      organizationName: org.name,
      invitedByEmail: ctx.session.user.email ?? '',
      invitedByName: ctx.session.user.name ?? ctx.session.user.email ?? '',
      token: String(invitation.token),
      invitationId: invitation.id,
      organizationId: org.id
    });

    revalidatePath(routes.dashboard.org(org.slug).settings.members);
  });
