import * as crypto from 'node:crypto';
import { describe, it, expect } from 'vitest';
import { verifyAbacatePaySignature } from '../providers/abacatepay/webhook';

describe('verifyAbacatePaySignature', () => {
  const secret = 'test-webhook-secret';

  it('returns true for valid HMAC-SHA256 hex signature', async () => {
    const payload =
      '{"event":"billing.paid","data":{"billing":{"id":"bl_123","status":"PAID"}}}';
    const expected = crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex');
    expect(await verifyAbacatePaySignature(payload, expected, secret)).toBe(
      true
    );
  });

  it('returns false for invalid signature', async () => {
    const rawBody = '{"event":"billing.paid","id":"evt_123"}';
    const invalidSig = 'invalid_signature_hex';
    expect(
      await verifyAbacatePaySignature(rawBody, invalidSig, secret)
    ).toBe(false);
  });

  it('returns false for empty signature', async () => {
    const rawBody = '{"event":"billing.paid"}';
    expect(await verifyAbacatePaySignature(rawBody, '', secret)).toBe(false);
  });
});
