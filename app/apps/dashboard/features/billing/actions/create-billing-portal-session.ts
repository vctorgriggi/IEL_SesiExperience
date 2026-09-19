'use server';

import { revalidatePath } from 'next/cache';
import { authOrganizationActionClient } from '@/actions/safe-action';
import {
  getBillingProvider,
  getDashboardUrl
} from '@/features/billing/server/get-billing-provider';
import { getCurrentMembership } from '@/features/members/data/get-current-membership';
import { can } from '@/features/members/permissions';

import { ForbiddenError, ValidationError } from '@workspace/common/errors';
import { routes } from '@workspace/routes';

export const createBillingPortalSession = authOrganizationActionClient
  .metadata({ actionName: 'createBillingPortalSession' })
  .action(async ({ ctx }) => {
    const membership = await getCurrentMembership();
    if (!can(membership).viewBilling) {
      throw new ForbiddenError(
        'Apenas administradores podem acessar a cobrança da organização.'
      );
    }

    const provider = getBillingProvider();
    if (!provider?.createPortalSession) {
      throw new Error('Portal de cobrança não disponível');
    }

    const org = ctx.organization;
    const customerId = org.billingCustomerId ?? null;
    if (!customerId) {
      throw new ValidationError(
        'Nenhum cliente de cobrança vinculado a esta organização'
      );
    }

    const dashboardUrl = getDashboardUrl();
    const result = await provider.createPortalSession({
      organizationId: org.id,
      customerId,
      returnUrl: `${dashboardUrl}/${org.slug}/billing`
    });

    revalidatePath(routes.dashboard.org(org.slug).billing.index);
    return { url: result.url };
  });
