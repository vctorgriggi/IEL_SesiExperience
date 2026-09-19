'use server';

import { revalidatePath } from 'next/cache';
import { authOrganizationActionClient } from '@/actions/safe-action';
import { can } from '@/features/members/permissions';

import { ForbiddenError, NotFoundError } from '@workspace/common/errors';
import { and, db, eq, membershipTable } from '@workspace/database';
import { routes } from '@workspace/routes';

import { getCurrentMembership } from '../data/get-current-membership';
import { memberIdSchema } from '../schemas/member-id-schema';

export const removeMember = authOrganizationActionClient
  .metadata({ actionName: 'removeMember' })
  .inputSchema(memberIdSchema)
  .action(async ({ parsedInput, ctx }) => {
    const membership = await getCurrentMembership();
    if (!can(membership).removeMembers) {
      throw new ForbiddenError(
        'Apenas administradores podem remover membros da organização.'
      );
    }

    const organizationId = ctx.organization.id;
    const targetUserId = parsedInput.memberId.trim();

    const [target] = await db
      .select({
        userId: membershipTable.userId,
        isOwner: membershipTable.isOwner
      })
      .from(membershipTable)
      .where(
        and(
          eq(membershipTable.userId, targetUserId),
          eq(membershipTable.organizationId, organizationId)
        )
      )
      .limit(1);

    if (!target) {
      throw new NotFoundError('Membro não encontrado');
    }

    if (target.isOwner) {
      throw new ForbiddenError(
        'Não é possível remover o proprietário da organização.'
      );
    }

    await db
      .delete(membershipTable)
      .where(
        and(
          eq(membershipTable.userId, targetUserId),
          eq(membershipTable.organizationId, organizationId)
        )
      );

    revalidatePath(
      routes.dashboard.org(ctx.organization.slug).settings.members
    );
  });
