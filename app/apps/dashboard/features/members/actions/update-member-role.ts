'use server';

import { revalidatePath } from 'next/cache';
import { authOrganizationActionClient } from '@/actions/safe-action';
import { can } from '@/features/members/permissions';

import { ForbiddenError, NotFoundError } from '@workspace/common/errors';
import { and, db, eq, membershipTable, Role, sql } from '@workspace/database';
import { routes } from '@workspace/routes';

import { getCurrentMembership } from '../data/get-current-membership';
import { updateMemberRoleSchema } from '../schemas/update-member-role-schema';

export const updateMemberRole = authOrganizationActionClient
  .metadata({ actionName: 'updateMemberRole' })
  .inputSchema(updateMemberRoleSchema)
  .action(async ({ parsedInput, ctx }) => {
    const membership = await getCurrentMembership();
    if (!can(membership).updateMemberRoles) {
      throw new ForbiddenError(
        'Apenas administradores podem alterar funções de membros.'
      );
    }

    const organizationId = ctx.organization.id;
    const targetUserId = parsedInput.memberId.trim();
    const newRole = parsedInput.role === 'admin' ? Role.ADMIN : Role.MEMBER;

    const [target] = await db
      .select({
        userId: membershipTable.userId,
        role: membershipTable.role,
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
        'Não é possível alterar a função do proprietário da organização.'
      );
    }

    if (target.role === Role.ADMIN && newRole === Role.MEMBER) {
      const [adminCount] = await db
        .select({
          count: sql<number>`count(*)::int`
        })
        .from(membershipTable)
        .where(
          and(
            eq(membershipTable.organizationId, organizationId),
            eq(membershipTable.role, Role.ADMIN)
          )
        );

      if (adminCount && adminCount.count <= 1) {
        throw new ForbiddenError(
          'Não é possível rebaixar o último administrador. Promova outro membro antes.'
        );
      }
    }

    await db
      .update(membershipTable)
      .set({ role: newRole })
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
