import { describe, it, expect } from 'vitest';
import { createStripeWebhookHandler } from '../webhook';
import { verifyAndParseAbacatePayWebhook } from '../providers/abacatepay/webhook';

describe('Stripe webhook handler – security', () => {
  it('returns 401 for invalid signature and does not persist data', async () => {
    // Handler retorna antes de criar repo quando assinatura é inválida; DB não é usado.
    const handler = createStripeWebhookHandler({
      db: {} as never,
      webhookSecret: 'whsec_test_secret',
      secretKey: 'sk_test_key'
    });

    const request = new Request('http://localhost/api/billing/webhook', {
      method: 'POST',
      body: '{"id":"evt_1","type":"checkout.session.completed"}',
      headers: { 'stripe-signature': 'invalid_signature' }
    });

    const response = await handler(request);

    expect(response.status).toBe(401);
    const json = (await response.json()) as { error?: string };
    expect(json.error).toBeDefined();
  });

  it('returns 401 when stripe-signature header is missing', async () => {
    const mockDb = Object.freeze({});
    const handler = createStripeWebhookHandler({
      db: mockDb as never,
      webhookSecret: 'whsec_test',
      secretKey: 'sk_test'
    });

    const request = new Request('http://localhost/api/billing/webhook', {
      method: 'POST',
      body: '{"id":"evt_1","type":"checkout.session.completed"}'
    });

    const response = await handler(request);

    expect(response.status).toBe(401);
  });
});

describe('AbacatePay webhook – signature verification', () => {
  it('throws on invalid signature and no data is processed', async () => {
    const rawBody = '{"event":"billing.paid","data":{}}';
    const wrongSignature = 'deadbeef';
    const secret = 'test_webhook_secret';

    await expect(
      verifyAndParseAbacatePayWebhook(rawBody, wrongSignature, secret)
    ).rejects.toThrow();
  });

  it('throws when signature header is empty', async () => {
    const rawBody = '{"event":"billing.paid","data":{}}';
    const secret = 'test_webhook_secret';

    await expect(
      verifyAndParseAbacatePayWebhook(rawBody, '', secret)
    ).rejects.toThrow();
  });
});
