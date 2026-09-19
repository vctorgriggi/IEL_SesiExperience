import type { DatabaseType } from '@workspace/database';

import type { BillingWebhookEvent, AbacatePayWebhookPayload } from './types';
import { extractPaidBillingId } from './paid-event';
import { BillingError } from '../../errors';
import { billingConfig, type PlanId } from '../../config';
import { PriceInterval, PriceType } from '../../schema';
import {
  createAbacatePayWebhookRepository,
  type AbacatePayWebhookRepository
} from './abacatepay-webhook-repository';

export type { AbacatePayWebhookPayload };

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++)
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(message)
  );
  return bytesToHex(new Uint8Array(sig));
}

export async function verifyAndParseAbacatePayWebhook(
  rawBody: string,
  signatureFromHeader: string,
  secret: string
): Promise<BillingWebhookEvent> {
  if (!secret) {
    throw new BillingError(
      'AbacatePay webhook secret not configured',
      'webhook_secret_missing'
    );
  }
  if (!(await verifyAbacatePaySignature(rawBody, signatureFromHeader, secret))) {
    throw new BillingError(
      'Invalid AbacatePay webhook signature',
      'webhook_signature_invalid'
    );
  }
  let payload: AbacatePayWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as AbacatePayWebhookPayload;
  } catch (err) {
    throw new BillingError('Invalid AbacatePay webhook JSON', 'webhook_parse_failed', err);
  }
  return {
    id: payload.id ?? 'evt_' + Date.now(),
    type: payload.event ?? 'unknown',
    provider: 'abacatepay',
    data: payload
  };
}

export async function verifyAbacatePaySignature(
  rawBody: string,
  signatureFromHeader: string,
  secret: string
): Promise<boolean> {
  const expectedHex = await hmacSha256Hex(secret, rawBody);
  if (signatureFromHeader.length !== expectedHex.length) return false;
  return timingSafeEqual(hexToBytes(signatureFromHeader), hexToBytes(expectedHex));
}

const ABACATEPAY_SERVICE = 'abacatepay';

function findProPriceId(interval: 'monthly' | 'yearly'): string | null {
  const product = billingConfig.products.find((p) => p.id === 'pro');
  if (!product) return null;

  const wanted = interval === 'yearly' ? PriceInterval.Year : PriceInterval.Month;
  for (const plan of product.plans) {
    for (const price of plan.prices) {
      if (price.type === PriceType.Recurring && price.interval === wanted) {
        return price.id;
      }
    }
  }

  return null;
}

function normalizeLegacyPlanType(value?: string | null): 'monthly' | 'yearly' | null {
  if (!value) return null;
  if (value === 'monthly' || value === 'yearly') return value;
  return null;
}

function toCanonicalFromExisting(existing: {
  planType?: string | null;
  productId?: string | null;
  priceId?: string | null;
  billingInterval?: string | null;
  priceType?: string | null;
}): {
  productId: PlanId;
  priceId: string;
  priceType: PriceType;
  billingInterval: 'monthly' | 'yearly' | null;
} | null {
  const legacyInterval =
    normalizeLegacyPlanType(existing.billingInterval) ??
    normalizeLegacyPlanType(existing.planType);

  const priceType =
    existing.priceType === PriceType.OneTime
      ? PriceType.OneTime
      : existing.priceType === PriceType.Recurring
        ? PriceType.Recurring
        : legacyInterval
          ? PriceType.Recurring
          : null;

  const productId =
    existing.productId && (existing.productId === 'free' || existing.productId === 'pro' || existing.productId === 'lifetime' || existing.productId === 'enterprise')
      ? (existing.productId as PlanId)
      : legacyInterval
        ? 'pro'
        : null;

  const resolvedPriceId =
    existing.priceId ??
    (legacyInterval ? findProPriceId(legacyInterval) : null);

  if (!productId || !resolvedPriceId || !priceType) return null;

  return {
    productId,
    priceId: resolvedPriceId,
    priceType,
    billingInterval: legacyInterval
  };
}

export async function handleAbacatePayEvent(
  repo: AbacatePayWebhookRepository,
  payload: AbacatePayWebhookPayload
): Promise<void> {
  const billingId = extractPaidBillingId(payload);
  if (!billingId) return;

  const existing = await repo.findAbacateBillingByBillingId(billingId);
  if (!existing) return;

  const resolved = toCanonicalFromExisting(existing);
  if (!resolved) return;

  await repo.updateAbacateBillingStatus(billingId, 'PAID');

  if (resolved.priceType === PriceType.OneTime) {
    const orderId = 'abacate_order_' + billingId;
    await repo.insertOrder({
      id: orderId,
      organizationId: existing.organizationId,
      status: 'paid',
      provider: ABACATEPAY_SERVICE,
      totalAmount: existing.amount / 100,
      currency: 'brl'
    });

    await repo.insertOrderItem({
      id: 'abacate_order_item_' + billingId,
      orderId,
      quantity: 1,
      productId: resolved.productId,
      variantId: resolved.priceId,
      priceAmount: existing.amount / 100
    });

    return;
  }

  const now = new Date();
  const periodEnd = new Date(now);
  if (resolved.billingInterval === 'yearly') {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  } else {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  }

  const subId = 'abacate_' + billingId;
  await repo.insertSubscription({
    id: subId,
    organizationId: existing.organizationId,
    status: 'active',
    active: true,
    provider: ABACATEPAY_SERVICE,
    cancelAtPeriodEnd: false,
    currency: 'brl',
    periodStartsAt: now,
    periodEndsAt: periodEnd
  });

  await repo.insertSubscriptionItem({
    id: 'abacate_item_' + billingId,
    subscriptionId: subId,
    quantity: 1,
    productId: resolved.productId,
    variantId: resolved.priceId,
    priceAmount: existing.amount / 100,
    interval: resolved.billingInterval === 'yearly' ? 'year' : 'month',
    intervalCount: 1
  });
}

export async function isAbacatePayEventProcessed(
  db: DatabaseType,
  eventId: string
): Promise<boolean> {
  const repo = createAbacatePayWebhookRepository(db);
  return repo.isEventProcessed(eventId);
}

export async function recordAbacatePayWebhookEvent(
  db: DatabaseType,
  eventId: string,
  eventType: string
): Promise<void> {
  const repo = createAbacatePayWebhookRepository(db);
  await repo.recordEvent(eventId, eventType);
}

/**
 * Full webhook flow: check dedup, handle event, record. Call after verifyAndParseAbacatePayWebhook.
 */
export async function processAbacatePayWebhook(
  db: DatabaseType,
  event: BillingWebhookEvent
): Promise<void> {
  if (event.provider !== 'abacatepay') return;
  const repo = createAbacatePayWebhookRepository(db);
  if (await repo.isEventProcessed(event.id)) return;
  await handleAbacatePayEvent(repo, event.data as AbacatePayWebhookPayload);
  await repo.recordEvent(event.id, event.type);
}
