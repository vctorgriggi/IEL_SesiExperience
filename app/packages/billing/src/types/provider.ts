/** Contratos do provider de billing. */

import type { PlanId } from '../config';
import type { PriceInterval, PriceType } from '../schema';

export interface BillingProvider {
  createCheckout(params: {
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
  }): Promise<{ url: string; billingId?: string; customerId?: string }>;

  createPortalSession?(params: {
    organizationId: string;
    customerId: string;
    returnUrl: string;
  }): Promise<{ url: string }>;

  /** Só Stripe. No AbacatePay é no-op/undefined. */
  cancelSubscription?(subscriptionId: string): Promise<void>;
}

/** Config mínimo para getStripeOrgOperations. */
export type StripeBillingConfigMinimal = {
  stripe: { secretKey?: string };
};

/** Operações de organização no Stripe. */
export type StripeOrgOperations = {
  cancelSubscription(subscriptionId: string): Promise<void>;
};
