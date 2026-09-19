'use server';

import { revalidatePath } from 'next/cache';
import { authOrganizationActionClient } from '@/actions/safe-action';
import {
  getBillingProvider,
  getDashboardUrl
} from '@/features/billing/server/get-billing-provider';
import { getCurrentMembership } from '@/features/members/data/get-current-membership';
import { can } from '@/features/members/permissions';

import {
  resolveBillingCheckout,
  type BillingInterval
} from '@workspace/billing';
import { ForbiddenError, ValidationError } from '@workspace/common/errors';
import { routes } from '@workspace/routes';

import { checkoutSchema } from '../schemas/checkout-schema';

export const createCheckoutSession = authOrganizationActionClient
  .metadata({ actionName: 'createCheckoutSession' })
  .inputSchema(checkoutSchema)
  .action(async ({ parsedInput, ctx }) => {
    const membership = await getCurrentMembership();
    if (!can(membership).viewBilling) {
      throw new ForbiddenError(
        'Apenas administradores podem acessar a cobrança da organização.'
      );
    }

    const provider = getBillingProvider();
    if (!provider) {
      throw new Error('Billing não configurado');
    }

    const resolution = resolveBillingCheckout(
      parsedInput.productId,
      parsedInput.billingInterval as BillingInterval | undefined
    );

    if (resolution.kind !== 'checkout') {
      throw new ValidationError('Este plano não possui checkout.');
    }

    const selection = resolution.selection;

    const dashboardUrl = getDashboardUrl();
    const org = ctx.organization;
    const customerId = org.billingCustomerId ?? null;

    const result = await provider.createCheckout({
      organizationId: org.id,
      organizationEmail: org.email ?? null,
      organizationName: org.name,
      customerId,
      productId: selection.productId,
      productName: selection.productName,
      priceId: selection.priceId,
      priceType: selection.priceType,
      priceInterval: selection.priceInterval,
      cost: selection.cost,
      currency: selection.currency,
      successUrl: `${dashboardUrl}/${org.slug}/billing/success`,
      cancelUrl: `${dashboardUrl}/${org.slug}/billing`
    });

    revalidatePath(routes.dashboard.org(org.slug).billing.index);
    return { url: result.url };
  });
