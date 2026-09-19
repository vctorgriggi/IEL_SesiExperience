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
  invitationTable,
  Role
} from '@workspace/database';
import { routes } from '@workspace/routes';

import { updateInvitationRoleSchema } from '../schemas/update-invitation-role-schema';

export const updateInvitationRole = authOrganizationActionClient
  .metadata({ actionName: 'updateInvitationRole' })
  .inputSchema(updateInvitationRoleSchema)
  .action(async ({ parsedInput, ctx }) => {
    const membership = await getCurrentMembership();
    if (!can(membership).inviteMembers) {
      throw new ForbiddenError(
        'Apenas administradores podem alterar a função do convite.'
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
      throw new ForbiddenError('Só é possível alterar convites pendentes.');
    }

    const role = parsedInput.role === 'admin' ? Role.ADMIN : Role.MEMBER;
    await db
      .update(invitationTable)
      .set({ role })
      .where(
        and(
          eq(invitationTable.id, parsedInput.invitationId),
          eq(invitationTable.organizationId, org.id)
        )
      );

    revalidatePath(routes.dashboard.org(org.slug).settings.members);
  });
