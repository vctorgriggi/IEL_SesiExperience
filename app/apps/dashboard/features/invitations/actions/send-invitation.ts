'use server';

import { revalidatePath } from 'next/cache';
import { authOrganizationActionClient } from '@/actions/safe-action';
import { getActivePlan } from '@/features/billing/data/get-active-plan';
import { getCurrentMembership } from '@/features/members/data/get-current-membership';
import { can } from '@/features/members/permissions';

import {
  checkIfCanInvite,
  createInvitation,
  sendInvitationRequest
} from '@workspace/auth/invitations';
import { canUseFeature } from '@workspace/billing';
import { ForbiddenError, PreConditionError } from '@workspace/common/errors';
import { Role } from '@workspace/database';
import { routes } from '@workspace/routes';

import { inviteMemberSchema } from '../schemas/invite-member-schema';

export const sendInvitation = authOrganizationActionClient
  .metadata({ actionName: 'sendInvitation' })
  .inputSchema(inviteMemberSchema)
  .action(async ({ parsedInput, ctx }) => {
    const membership = await getCurrentMembership();
    if (!can(membership).inviteMembers) {
      throw new ForbiddenError(
        'Apenas administradores podem convidar membros para a organização.'
      );
    }

    const planId = getActivePlan(ctx.organization);
    if (!canUseFeature(planId, 'invite_members')) {
      throw new PreConditionError(
        'Seu plano não permite convidar membros. Faça upgrade para convidar.'
      );
    }

    const org = ctx.organization;

    const canInvite = await checkIfCanInvite(parsedInput.email, org.id);
    if (!canInvite) {
      throw new PreConditionError(
        'Este e-mail já é membro ou possui convite pendente para esta organização.'
      );
    }

    const role = parsedInput.role === 'admin' ? Role.ADMIN : Role.MEMBER;
    const newInvitation = await createInvitation(
      parsedInput.email,
      role,
      org.id
    );
    if (!newInvitation) {
      throw new Error('Falha ao criar convite.');
    }

    await sendInvitationRequest({
      email: parsedInput.email,
      organizationName: org.name,
      invitedByEmail: ctx.session.user.email ?? '',
      invitedByName: ctx.session.user.name ?? ctx.session.user.email ?? '',
      token: String(newInvitation.token),
      invitationId: newInvitation.id,
      organizationId: org.id
    });

    revalidatePath(routes.dashboard.org(org.slug).settings.members);
  });
