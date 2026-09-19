/** Tipos normalizados dos eventos Stripe. */

/** Item de assinatura. */
export type StripeSubscriptionItemPayload = {
  id: string;
  subscriptionId: string;
  quantity: number;
  productId: string;
  variantId: string;
  priceAmount: number | null;
  interval: string;
  intervalCount: number;
  type?: string;
  model?: string;
};

/** Payload base de assinatura. */
export type StripeSubscriptionPayload = {
  subscriptionId: string;
  organizationId?: string;
  customerId: string;
  status: string;
  active: boolean;
  cancelAtPeriodEnd: boolean;
  currency: string;
  periodStartsAt: Date;
  periodEndsAt: Date;
  trialStartsAt: Date | null;
  trialEndsAt: Date | null;
  items: StripeSubscriptionItemPayload[];
};

/** Payload de checkout.session.completed. */
export type StripeCheckoutSessionCompletedPayload = {
  mode: 'subscription' | 'payment';
  sessionId: string;
  customerId: string;
  customerEmail?: string;
  organizationId?: string;
  subscription?: StripeSubscriptionPayload;
  /** Detalhes de pagamento avulso. */
  order?: {
    sessionId: string;
    amountTotal: number | null;
    currency: string;
    paymentStatus: string;
    productId?: string;
    priceId?: string;
    priceType?: string;
    priceInterval?: string;
  };
};

/** Payload de aviso de fim de teste. */
export type StripeSubscriptionTrialWillEndPayload = StripeSubscriptionPayload & {
  trialEndsAt: Date;
};

/** Payload de fatura. */
export type StripeInvoicePayload = {
  id: string;
  customerId: string;
  subscriptionId: string | null;
  amountPaid: number;
  amountDue: number;
  currency: string;
  status: string;
  invoicePdf?: string;
};

/** Payload de estorno da cobrança. */
export type StripeChargeRefundedPayload = {
  chargeId: string;
  amountRefunded: number;
  refunded: boolean;
};

/** Payload de reembolso. */
export type StripeRefundPayload = {
  id: string;
  chargeId: string;
  amount: number;
  status: string;
  reason?: string;
};

/** Payload de disputa. */
export type StripeDisputePayload = {
  id: string;
  chargeId: string;
  amount: number;
  currency: string;
  status: string;
  reason?: string;
};

/** Payload de payment_intent. */
export type StripePaymentIntentPayload = {
  id: string;
  amount: number;
  currency: string;
  status: string;
};

/** Callbacks opcionais por evento Stripe. */
export type StripeWebhookCallbacks = {
  onCheckoutSessionCompleted?: (payload: StripeCheckoutSessionCompletedPayload) => Promise<void>;
  onSubscriptionCreated?: (payload: StripeSubscriptionPayload) => Promise<void>;
  onSubscriptionUpdated?: (payload: StripeSubscriptionPayload) => Promise<void>;
  onSubscriptionDeleted?: (payload: StripeSubscriptionPayload) => Promise<void>;
  onSubscriptionTrialWillEnd?: (payload: StripeSubscriptionTrialWillEndPayload) => Promise<void>;
  onSubscriptionPaused?: (payload: StripeSubscriptionPayload) => Promise<void>;
  onSubscriptionResumed?: (payload: StripeSubscriptionPayload) => Promise<void>;
  onInvoicePaid?: (payload: StripeInvoicePayload) => Promise<void>;
  onInvoicePaymentFailed?: (payload: StripeInvoicePayload) => Promise<void>;
  onChargeRefunded?: (payload: StripeChargeRefundedPayload) => Promise<void>;
  onRefundCreated?: (payload: StripeRefundPayload) => Promise<void>;
  onRefundUpdated?: (payload: StripeRefundPayload) => Promise<void>;
  onRefundFailed?: (payload: StripeRefundPayload) => Promise<void>;
  onDisputeCreated?: (payload: StripeDisputePayload) => Promise<void>;
  onDisputeUpdated?: (payload: StripeDisputePayload) => Promise<void>;
  onDisputeClosed?: (payload: StripeDisputePayload) => Promise<void>;
  onCustomerDeleted?: (customerId: string) => Promise<void>;
  onPaymentIntentSucceeded?: (payload: StripePaymentIntentPayload) => Promise<void>;
};
