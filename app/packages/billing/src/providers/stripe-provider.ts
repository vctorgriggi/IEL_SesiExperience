import type { DatabaseType } from '@workspace/database';
import type { BillingProvider } from '../types';
import {
  getStripeClient,
  getStripeOrgOperations,
  createStripeCheckoutAndPersist
} from './stripe';
import { BillingError } from '../errors';

export type StripeConfig = {
  secretKey: string;
};

export function createStripeProvider(
  config: StripeConfig,
  db: DatabaseType
): BillingProvider {
  const stripe = getStripeClient(config.secretKey);
  const orgOps = getStripeOrgOperations({ stripe: { secretKey: config.secretKey } });

  return {
    async createCheckout(params) {
      const result = await createStripeCheckoutAndPersist(db, stripe, {
        organizationId: params.organizationId,
        organizationEmail: params.organizationEmail,
        organizationName: params.organizationName,
        customerId: params.customerId,
        productId: params.productId,
        productName: params.productName,
        priceId: params.priceId,
        priceType: params.priceType,
        priceInterval: params.priceInterval,
        cost: params.cost,
        currency: params.currency,
        successUrl: params.successUrl,
        cancelUrl: params.cancelUrl
      });
      return { url: result.url, customerId: result.customerId };
    },

    async createPortalSession(params) {
      try {
        const session = await stripe.billingPortal.sessions.create({
          customer: params.customerId,
          return_url: params.returnUrl
        });
        if (!session.url) {
          throw new BillingError(
            'Portal session URL not returned',
            'portal_url_missing'
          );
        }
        return { url: session.url };
      } catch (err) {
        if (err instanceof BillingError) throw err;
        throw new BillingError(
          'Failed to create Stripe portal session',
          'stripe_api',
          err
        );
      }
    },

    async cancelSubscription(subscriptionId) {
      if (!orgOps) {
        throw new BillingError('Stripe not configured', 'configuration');
      }
      await orgOps.cancelSubscription(subscriptionId);
    }
  };
}
