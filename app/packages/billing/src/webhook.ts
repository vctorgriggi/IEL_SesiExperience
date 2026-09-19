import type { DatabaseType } from '@workspace/database';
import { createStripeWebhookRepository } from './providers/stripe/stripe-webhook-repository';
import { getStripeClient } from './providers/stripe/client';
import { verifyStripeWebhook, handleStripeWebhookEvent } from './providers/stripe/webhooks';
import { BillingError } from './errors';

export type CreateStripeWebhookHandlerDeps = {
  db: DatabaseType;
  webhookSecret: string;
  secretKey: string;
};

export function createStripeWebhookHandler(
  deps: CreateStripeWebhookHandlerDeps
): (request: Request) => Promise<Response> {
  const { db, webhookSecret, secretKey } = deps;
  const getStripe = () => getStripeClient(secretKey);

  return async function POST(request: Request): Promise<Response> {
    try {
      const event = await verifyStripeWebhook(request, webhookSecret);
      const repo = createStripeWebhookRepository(db);

      if (await repo.isEventProcessed(event.id)) {
        return new Response(
          JSON.stringify({ received: true }),
          { status: 200, headers: { 'Cache-Control': 'no-store' } }
        );
      }

      await handleStripeWebhookEvent(
        event,
        {
          onCheckoutSessionCompleted: (payload) => repo.applyCheckoutSessionCompleted(payload),
          onSubscriptionCreated: (payload) => repo.applySubscriptionCreated(payload),
          onSubscriptionUpdated: (payload) => repo.applySubscriptionUpdated(payload),
          onSubscriptionDeleted: (payload) => repo.applySubscriptionDeleted(payload),
          onSubscriptionPaused: (payload) => repo.applySubscriptionPaused(payload),
          onSubscriptionResumed: (payload) => repo.applySubscriptionResumed(payload),
          onCustomerDeleted: (customerId) => repo.clearOrgBillingCustomerId(customerId)
          // invoice/refund/dispute/payment_intent: no-op por padrão (app pode injetar callbacks)
        },
        { getStripe }
      );

      await repo.recordEvent(event.id, event.type);

      return new Response(
        JSON.stringify({ received: true }),
        { status: 200, headers: { 'Cache-Control': 'no-store' } }
      );
    } catch (err) {
      if (err instanceof BillingError) {
        const status =
          err.code === 'webhook_signature_invalid' ||
          err.code === 'webhook_secret_missing'
            ? 401
            : 400;
        return new Response(
          JSON.stringify({ error: err.message }),
          { status, headers: { 'Cache-Control': 'no-store' } }
        );
      }
      console.error('[Stripe webhook]', err);
      return new Response(
        JSON.stringify({ error: 'Webhook handler failed' }),
        { status: 500, headers: { 'Cache-Control': 'no-store' } }
      );
    }
  };
}
