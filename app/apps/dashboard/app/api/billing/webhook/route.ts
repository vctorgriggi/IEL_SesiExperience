import { createStripeWebhookHandler } from '@workspace/billing/webhook';
import { db } from '@workspace/database';

const webhookSecret = process.env.BILLING_STRIPE_WEBHOOK_SECRET ?? '';
const secretKey = process.env.BILLING_STRIPE_SECRET_KEY ?? '';

const handler = createStripeWebhookHandler({
  db,
  webhookSecret,
  secretKey
});

export const POST = handler;
