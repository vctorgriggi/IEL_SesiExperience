import type {
  StripeOrgOperations,
  StripeBillingConfigMinimal
} from '../../types';
import { BillingError } from '../../errors';
import { getStripeClient } from './client';

export function getStripeOrgOperations(
  config: StripeBillingConfigMinimal
): StripeOrgOperations | null {
  if (!config.stripe.secretKey) {
    return null;
  }
  const stripe = getStripeClient(config.stripe.secretKey);

  return {
    async cancelSubscription(subscriptionId) {
      try {
        await stripe.subscriptions.cancel(subscriptionId);
      } catch (err) {
        throw new BillingError(
          `Failed to cancel subscription ${subscriptionId}`,
          'stripe_api',
          err
        );
      }
    }
  };
}
