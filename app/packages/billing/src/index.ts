/** @workspace/billing – abstração de billing (Stripe + AbacatePay). */

export * from './types';
export * from './config';

export { canUseFeature, getMaxMembersForPlan, PLAN_FEATURES } from './plan-features';
export type { PlanFeature } from './plan-features';

export { resolveBillingCheckout } from './checkout-resolver';
export type {
  BillingCheckoutResolution,
  BillingCheckoutSelection,
  BillingInterval
} from './checkout-resolver';

export { resolveOrganizationPlanId } from './plan-resolver';
export type { OrganizationForPlanResolution } from './plan-resolver';

export { PriceInterval, PriceType } from './schema';
export type { Product, Plan, Price } from './schema';
export { BillingError } from './errors';
export {
  createPurchasesHelper,
  freeProductExists,
  getBillingProductsConfig
} from './helpers';
export type {
  BillingProductConfig,
  OrganizationForPurchases
} from './helpers';
export type { BillingErrorCode } from './errors';

export {
  verifyStripeWebhook,
  handleStripeWebhookEvent
} from './providers/stripe/webhooks';
export type { HandleStripeWebhookOptions } from './providers/stripe/webhooks';
export type {
  StripeWebhookCallbacks,
  StripeCheckoutSessionCompletedPayload,
  StripeSubscriptionPayload,
  StripeSubscriptionTrialWillEndPayload,
  StripeInvoicePayload,
  StripeChargeRefundedPayload,
  StripeRefundPayload,
  StripeDisputePayload,
  StripePaymentIntentPayload
} from './providers/stripe/webhook-payloads';
export { createStripeWebhookHandler } from './webhook';
export type { CreateStripeWebhookHandlerDeps } from './webhook';

export {
  verifyAbacatePaySignature,
  verifyAndParseAbacatePayWebhook,
  handleAbacatePayEvent,
  isAbacatePayEventProcessed,
  recordAbacatePayWebhookEvent,
  processAbacatePayWebhook
} from './providers/abacatepay/webhook';
export type { AbacatePayWebhookPayload } from './providers/abacatepay/webhook';
export { extractPaidBillingId } from './providers/abacatepay/paid-event';

export { createStripeProvider } from './providers/stripe-provider';
export { createAbacatePayProvider } from './providers/abacatepay-provider';
export type { BillingProvider, StripeOrgOperations } from './types';
export { getStripeOrgOperations } from './providers/stripe';
export {
  createAbacatePayWebhookRepository,
  type AbacatePayWebhookRepository,
  type AbacateBillingRow,
  type AbacateSubscriptionInsert,
  type AbacateSubscriptionItemInsert
} from './providers/abacatepay/abacatepay-webhook-repository';

export {
  createAbacatePayCustomerForUser,
  createAbacatePayCustomerForOrganization
} from './providers/abacatepay/create-customer';
export type {
  CreateAbacatePayCustomerForUserInput,
  CreateAbacatePayCustomerForOrganizationInput
} from './providers/abacatepay/create-customer';

export { getAbacatePayClient } from './providers/abacatepay/client';
