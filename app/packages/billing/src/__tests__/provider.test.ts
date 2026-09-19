import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCancel = vi.fn().mockResolvedValue(undefined);

vi.mock('stripe', () => ({
  default: vi.fn(() => ({
    subscriptions: { cancel: mockCancel }
  }))
}));

import { getStripeOrgOperations } from '../providers/stripe/org-operations';

function getStripeConfig() {
  return { stripe: { secretKey: process.env.BILLING_STRIPE_SECRET_KEY } };
}

beforeEach(() => {
  process.env.BILLING_STRIPE_SECRET_KEY = 'sk_test_mock';
  vi.clearAllMocks();
});

describe('getStripeOrgOperations', () => {
  it('returns null when Stripe key is missing', () => {
    delete process.env.BILLING_STRIPE_SECRET_KEY;
    expect(getStripeOrgOperations(getStripeConfig())).toBeNull();
  });

  it('returns ops when Stripe is configured', () => {
    const ops = getStripeOrgOperations(getStripeConfig());
    expect(ops).not.toBeNull();
    expect(ops).toHaveProperty('cancelSubscription');
  });
});

describe('StripeOrgOperations.cancelSubscription', () => {
  it('cancels a Stripe subscription', async () => {
    const ops = getStripeOrgOperations(getStripeConfig());
    expect(ops).not.toBeNull();
    await ops!.cancelSubscription('sub_123');
    expect(mockCancel).toHaveBeenCalledWith('sub_123');
  });
});

