/**
 * defines Stripe-specific checkout types.
 */

import type { PlanId } from '../../config';
import type { PriceInterval, PriceType } from '../../schema';

export type { BillingWebhookEvent } from '../../types';

export type CreateStripeCheckoutInput = {
  organizationId: string;
  organizationEmail: string | null;
  organizationName: string;
  customerId: string | null;
  productId: PlanId;
  productName: string;
  priceId: string;
  priceType: PriceType;
  priceInterval?: PriceInterval;
  cost: number;
  currency: string;
  successUrl: string;
  cancelUrl: string;
};

export type CreateStripeCheckoutResult = {
  url: string;
  customerId?: string;
};
