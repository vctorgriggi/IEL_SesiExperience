import type Stripe from 'stripe';
import StripeSDK from 'stripe';

import { BillingError } from '../../errors';
import * as BillingCatalog from '../../config';
import type { StripeWebhookCallbacks } from './webhook-payloads';
import type {
  StripeCheckoutSessionCompletedPayload,
  StripeSubscriptionPayload,
  StripeSubscriptionTrialWillEndPayload,
  StripeInvoicePayload,
  StripeChargeRefundedPayload,
  StripeRefundPayload,
  StripeDisputePayload,
  StripePaymentIntentPayload
} from './webhook-payloads';

/** Opções do handleStripeWebhookEvent. */
export type HandleStripeWebhookOptions = {
  getStripe: () => Stripe;
};

/** Valida assinatura do webhook Stripe. */
export async function verifyStripeWebhook(
  request: Request,
  webhookSecret: string
): Promise<Stripe.Event> {
  const body = await request.clone().text();
  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    throw new BillingError('Missing stripe-signature header', 'webhook_signature_invalid');
  }
  try {
    const event = StripeSDK.webhooks.constructEvent(body, signature, webhookSecret);
    return event as Stripe.Event;
  } catch (err) {
    throw new BillingError(
      'Invalid Stripe webhook signature',
      'webhook_signature_invalid',
      err
    );
  }
}

function safeDate(ts: unknown): Date {
  const n = typeof ts === 'number' && Number.isFinite(ts) ? ts * 1000 : NaN;
  const d = new Date(n);
  return Number.isFinite(d.getTime()) ? d : new Date(0);
}

/**
 * Na API 2025+/SDK v22 `invoice.subscription` foi removido; a assinatura passou
 * a viver em `invoice.parent.subscription_details.subscription`.
 */
function invoiceSubscriptionId(inv: Stripe.Invoice): string | null {
  const sub = inv.parent?.subscription_details?.subscription;
  if (sub == null) return null;
  return typeof sub === 'string' ? sub : sub.id;
}

/** Monta payload normalizado de assinatura. */
function buildSubscriptionPayload(sub: Stripe.Subscription): StripeSubscriptionPayload {
  // Na API 2025+/SDK v22 os campos de período saíram do objeto Subscription e
  // passaram para cada item da assinatura.
  const firstItem = sub.items?.data?.[0];
  const periodStart = safeDate(firstItem?.current_period_start);
  const periodEnd = safeDate(firstItem?.current_period_end);
  const metadataProductId = sub.metadata?.productId;
  const canonicalProductId =
    typeof metadataProductId === 'string' &&
    BillingCatalog.isPlanId(metadataProductId)
      ? metadataProductId
      : null;
  const items = (sub.items?.data ?? []).map((item) => ({
    id: item.id,
    subscriptionId: sub.id,
    quantity: item.quantity ?? 1,
    productId:
      canonicalProductId ??
      (typeof item.price.product === 'string'
        ? item.price.product
        : (item.price.product as Stripe.Product)?.id ?? ''),
    variantId: item.price.id,
    priceAmount: item.price.unit_amount ? item.price.unit_amount / 100 : null,
    interval: item.price.recurring?.interval ?? 'month',
    intervalCount: item.price.recurring?.interval_count ?? 1,
    type: item.price.type ?? undefined,
    // `recurring.aggregate_usage` foi removido na API 2025+ (medição migrou
    // para Meters); sem equivalente 1:1 no payload normalizado.
    model: undefined
  }));
  return {
    subscriptionId: sub.id,
    organizationId: sub.metadata?.organizationId as string | undefined,
    customerId: sub.customer as string,
    status: sub.status,
    active: ['active', 'trialing'].includes(sub.status),
    cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
    currency: sub.currency ?? 'usd',
    periodStartsAt: periodStart,
    periodEndsAt: periodEnd,
    trialStartsAt: sub.trial_start != null ? safeDate(sub.trial_start) : null,
    trialEndsAt: sub.trial_end != null ? safeDate(sub.trial_end) : null,
    items
  };
}

/** Processa evento Stripe e dispara callbacks. */
export async function handleStripeWebhookEvent(
  event: Stripe.Event,
  callbacks: StripeWebhookCallbacks,
  options: HandleStripeWebhookOptions
): Promise<void> {
  const { getStripe } = options;

  const noop = async (): Promise<void> => {};

  switch (event.type) {
    case 'checkout.session.completed': {
      const cb = callbacks.onCheckoutSessionCompleted ?? noop;
      const session = event.data.object as Stripe.Checkout.Session;
      const customerId = session.customer as string | null;
      if (!customerId) break;
      const subscriptionId = session.subscription as string | null;
      const isSubscription = session.mode === 'subscription';
      const orgId = (session.metadata?.organizationId ?? session.client_reference_id) as
        | string
        | undefined;

      if (isSubscription && subscriptionId) {
        const stripe = getStripe();
        let sub: Stripe.Subscription;
        try {
          sub = await stripe.subscriptions.retrieve(subscriptionId);
        } catch (err) {
          throw new BillingError(
            `Failed to retrieve subscription ${subscriptionId}`,
            'stripe_api',
            err
          );
        }
        const subscriptionPayload = buildSubscriptionPayload(sub);
        const payload: StripeCheckoutSessionCompletedPayload = {
          mode: 'subscription',
          sessionId: session.id,
          customerId,
          customerEmail: session.customer_email as string | undefined,
          organizationId: orgId,
          subscription: subscriptionPayload
        };
        await cb(payload);
      } else {
        const payload: StripeCheckoutSessionCompletedPayload = {
          mode: 'payment',
          sessionId: session.id,
          customerId,
          customerEmail: session.customer_email as string | undefined,
          organizationId: orgId,
          order: {
            sessionId: session.id,
            amountTotal: session.amount_total,
            currency: session.currency ?? 'usd',
            paymentStatus: session.payment_status ?? 'unpaid',
            productId: session.metadata?.productId ?? undefined,
            priceId: session.metadata?.priceId ?? undefined,
            priceType: session.metadata?.priceType ?? undefined,
            priceInterval: session.metadata?.priceInterval ?? undefined
          }
        };
        await cb(payload);
      }
      break;
    }

    case 'customer.subscription.created': {
      const cb = callbacks.onSubscriptionCreated ?? noop;
      const sub = event.data.object as Stripe.Subscription;
      await cb(buildSubscriptionPayload(sub));
      break;
    }

    case 'customer.subscription.updated': {
      const cb = callbacks.onSubscriptionUpdated ?? noop;
      const sub = event.data.object as Stripe.Subscription;
      await cb(buildSubscriptionPayload(sub));
      break;
    }

    case 'customer.subscription.deleted': {
      const cb = callbacks.onSubscriptionDeleted ?? noop;
      const sub = event.data.object as Stripe.Subscription;
      await cb(buildSubscriptionPayload(sub));
      break;
    }

    case 'customer.subscription.trial_will_end': {
      const cb = callbacks.onSubscriptionTrialWillEnd ?? noop;
      const sub = event.data.object as Stripe.Subscription;
      const payload = buildSubscriptionPayload(sub) as StripeSubscriptionTrialWillEndPayload;
      payload.trialEndsAt = sub.trial_end != null ? safeDate(sub.trial_end) : payload.trialEndsAt;
      await cb(payload);
      break;
    }

    case 'customer.subscription.paused': {
      const cb = callbacks.onSubscriptionPaused ?? noop;
      const sub = event.data.object as Stripe.Subscription;
      await cb(buildSubscriptionPayload(sub));
      break;
    }

    case 'customer.subscription.resumed': {
      const cb = callbacks.onSubscriptionResumed ?? noop;
      const sub = event.data.object as Stripe.Subscription;
      await cb(buildSubscriptionPayload(sub));
      break;
    }

    case 'invoice.paid': {
      const cb = callbacks.onInvoicePaid ?? noop;
      const inv = event.data.object as Stripe.Invoice;
      const payload: StripeInvoicePayload = {
        id: inv.id,
        customerId: inv.customer as string,
        subscriptionId: invoiceSubscriptionId(inv),
        amountPaid: inv.amount_paid ?? 0,
        amountDue: inv.amount_due ?? 0,
        currency: inv.currency ?? 'usd',
        status: inv.status ?? 'paid',
        invoicePdf: inv.invoice_pdf ?? undefined
      };
      await cb(payload);
      break;
    }

    case 'invoice.payment_failed': {
      const cb = callbacks.onInvoicePaymentFailed ?? noop;
      const inv = event.data.object as Stripe.Invoice;
      const payload: StripeInvoicePayload = {
        id: inv.id,
        customerId: inv.customer as string,
        subscriptionId: invoiceSubscriptionId(inv),
        amountPaid: inv.amount_paid ?? 0,
        amountDue: inv.amount_due ?? 0,
        currency: inv.currency ?? 'usd',
        status: inv.status ?? 'open',
        invoicePdf: inv.invoice_pdf ?? undefined
      };
      await cb(payload);
      break;
    }

    case 'charge.refunded': {
      const cb = callbacks.onChargeRefunded ?? noop;
      const charge = event.data.object as Stripe.Charge;
      const payload: StripeChargeRefundedPayload = {
        chargeId: charge.id,
        amountRefunded: charge.amount_refunded ?? 0,
        refunded: charge.refunded ?? false
      };
      await cb(payload);
      break;
    }

    case 'refund.created': {
      const cb = callbacks.onRefundCreated ?? noop;
      const ref = event.data.object as Stripe.Refund;
      const payload: StripeRefundPayload = {
        id: ref.id,
        chargeId: ref.charge as string,
        amount: ref.amount ?? 0,
        status: ref.status ?? 'succeeded',
        reason: ref.reason ?? undefined
      };
      await cb(payload);
      break;
    }

    case 'refund.updated': {
      const cb = callbacks.onRefundUpdated ?? noop;
      const ref = event.data.object as Stripe.Refund;
      const payload: StripeRefundPayload = {
        id: ref.id,
        chargeId: ref.charge as string,
        amount: ref.amount ?? 0,
        status: ref.status ?? 'succeeded',
        reason: ref.reason ?? undefined
      };
      await cb(payload);
      break;
    }

    case 'refund.failed': {
      const cb = callbacks.onRefundFailed ?? noop;
      const ref = event.data.object as Stripe.Refund;
      const payload: StripeRefundPayload = {
        id: ref.id,
        chargeId: ref.charge as string,
        amount: ref.amount ?? 0,
        status: ref.status ?? 'failed',
        reason: ref.reason ?? undefined
      };
      await cb(payload);
      break;
    }

    case 'charge.dispute.created': {
      const cb = callbacks.onDisputeCreated ?? noop;
      const dispute = event.data.object as Stripe.Dispute;
      const payload: StripeDisputePayload = {
        id: dispute.id,
        chargeId: dispute.charge as string,
        amount: dispute.amount ?? 0,
        currency: dispute.currency ?? 'usd',
        status: dispute.status ?? 'open',
        reason: dispute.reason ?? undefined
      };
      await cb(payload);
      break;
    }

    case 'charge.dispute.updated': {
      const cb = callbacks.onDisputeUpdated ?? noop;
      const dispute = event.data.object as Stripe.Dispute;
      const payload: StripeDisputePayload = {
        id: dispute.id,
        chargeId: dispute.charge as string,
        amount: dispute.amount ?? 0,
        currency: dispute.currency ?? 'usd',
        status: dispute.status ?? 'open',
        reason: dispute.reason ?? undefined
      };
      await cb(payload);
      break;
    }

    case 'charge.dispute.closed': {
      const cb = callbacks.onDisputeClosed ?? noop;
      const dispute = event.data.object as Stripe.Dispute;
      const payload: StripeDisputePayload = {
        id: dispute.id,
        chargeId: dispute.charge as string,
        amount: dispute.amount ?? 0,
        currency: dispute.currency ?? 'usd',
        status: dispute.status ?? 'lost',
        reason: dispute.reason ?? undefined
      };
      await cb(payload);
      break;
    }

    case 'customer.deleted': {
      const cb = callbacks.onCustomerDeleted ?? noop;
      const customer = event.data.object as Stripe.Customer;
      await cb(customer.id);
      break;
    }

    case 'payment_intent.succeeded': {
      const cb = callbacks.onPaymentIntentSucceeded ?? noop;
      const pi = event.data.object as Stripe.PaymentIntent;
      const payload: StripePaymentIntentPayload = {
        id: pi.id,
        amount: pi.amount ?? 0,
        currency: pi.currency ?? 'usd',
        status: pi.status ?? 'succeeded'
      };
      await cb(payload);
      break;
    }

    default:
      break;
  }
}
