import type Stripe from 'stripe';

import {
  organizationTable,
  eq,
  type DatabaseType
} from '@workspace/database';

import type {
  CreateStripeCheckoutInput,
  CreateStripeCheckoutResult
} from './types';
import { BillingError } from '../../errors';
import { PriceType } from '../../schema';

function buildMetadata(input: CreateStripeCheckoutInput): Record<string, string> {
  const metadata: Record<string, string> = {
    organizationId: input.organizationId,
    productId: input.productId,
    priceId: input.priceId,
    priceType: input.priceType,
    currency: input.currency
  };

  if (input.priceInterval) {
    metadata.priceInterval = input.priceInterval;
  }

  return metadata;
}

/** Cria sessão de checkout Stripe e persiste billingCustomerId na org quando um novo customer é criado. */
export async function createStripeCheckoutAndPersist(
  db: DatabaseType,
  stripe: Stripe,
  input: CreateStripeCheckoutInput
): Promise<CreateStripeCheckoutResult> {
  const [org] = await db
    .select({ id: organizationTable.id })
    .from(organizationTable)
    .where(eq(organizationTable.id, input.organizationId))
    .limit(1);

  if (!org) {
    throw new BillingError('Organization not found', 'organization_not_found');
  }

  let customerId = input.customerId;

  if (!customerId) {
    try {
      const customer = await stripe.customers.create({
        name: input.organizationName,
        email: input.organizationEmail ?? undefined,
        metadata: { organizationId: input.organizationId }
      });
      customerId = customer.id;
    } catch (err) {
      throw new BillingError(
        'Failed to create Stripe customer',
        'stripe_api',
        err
      );
    }
  }

  const metadata = buildMetadata(input);

  let session: Stripe.Checkout.Session;
  try {
    if (input.priceType === PriceType.Recurring) {
      session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer: customerId!,
        client_reference_id: input.organizationId,
        metadata,
        line_items: [{ price: input.priceId, quantity: 1 }],
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
        subscription_data: {
          trial_period_days: input.productId === 'pro' ? 7 : undefined,
          metadata
        },
        allow_promotion_codes: true
      });
    } else {
      session = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer: customerId!,
        client_reference_id: input.organizationId,
        metadata,
        line_items: [{ price: input.priceId, quantity: 1 }],
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
        payment_intent_data: { metadata },
        allow_promotion_codes: true
      });
    }
  } catch (err) {
    if (err instanceof BillingError) throw err;
    throw new BillingError(
      'Failed to create Stripe checkout session',
      'stripe_api',
      err
    );
  }

  if (!session.url) {
    throw new BillingError(
      'Failed to create checkout session URL',
      'checkout_url_missing'
    );
  }

  const needsOrgUpdate = !input.customerId && customerId;

  if (needsOrgUpdate) {
    await db.transaction(async (tx) => {
      await tx
        .update(organizationTable)
        .set({ billingCustomerId: customerId! })
        .where(eq(organizationTable.id, input.organizationId));
    });
  }

  return { url: session.url, customerId: customerId ?? undefined };
}
