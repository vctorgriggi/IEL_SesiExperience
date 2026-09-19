'use server';

import { redirect } from 'next/navigation';
import { authActionClient } from '@/actions/safe-action';
import { getActivePlanByOrganizationId } from '@/features/billing/data/get-active-plan';

import { acceptInvitation } from '@workspace/auth/invitations';
import { getMaxMembersForPlan } from '@workspace/billing';
import { db, eq, invitationTable, membershipTable } from '@workspace/database';
import { routes } from '@workspace/routes';

import { acceptInvitationBodySchema } from '../schemas/accept-invitation-schema';

/**
 * Aceita um convite: cria a membership e redireciona para a organização.
 * Respeita limite de membros do plano (ex.: free = 1).
 */
export const acceptInvitationAction = authActionClient
  .metadata({ actionName: 'acceptInvitation' })
  .inputSchema(acceptInvitationBodySchema)
  .action(async ({ parsedInput, ctx }) => {
    const token = parsedInput.token.trim();
    const userEmail = ctx.session.user.email ?? '';
    const requestPath = routes.dashboard.invitations.request(token);

    const [invitation] = await db
      .select({
        organizationId: invitationTable.organizationId,
        status: invitationTable.status
      })
      .from(invitationTable)
      .where(eq(invitationTable.token, token))
      .limit(1);

    if (invitation?.organizationId) {
      const planId = await getActivePlanByOrganizationId(
        invitation.organizationId
      );
      const maxMembers = getMaxMembersForPlan(planId);
      const members = await db
        .select({ id: membershipTable.id })
        .from(membershipTable)
        .where(eq(membershipTable.organizationId, invitation.organizationId));
      if (members.length >= maxMembers) {
        redirect(
          `${requestPath}?${new URLSearchParams({ error: 'member_limit' }).toString()}`
        );
      }
    }

    const result = await acceptInvitation(
      token,
      ctx.session.user.id,
      userEmail
    );

    if (result.ok) {
      return redirect(routes.dashboard.select(result.organizationSlug));
    }

    const reasonRedirects: Record<string, string> = {
      already_accepted: routes.dashboard.invitations.alreadyAccepted,
      revoked: routes.dashboard.invitations.revoked,
      email_mismatch: `${requestPath}?${new URLSearchParams({
        error: 'email_mismatch'
      })}`
    };

    const target = reasonRedirects[result.reason];

    if (target) {
      return redirect(target);
    }

    redirect(
      `${requestPath}?${new URLSearchParams({ error: 'invalid' }).toString()}`
    );
  });
