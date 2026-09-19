import { describe, it, expect, vi } from 'vitest';
import { verifyStripeWebhook, handleStripeWebhookEvent } from '../providers/stripe/webhooks';
import { BillingError } from '../errors';

describe('verifyStripeWebhook', () => {
  it('throws BillingError with code webhook_signature_invalid for invalid signature', async () => {
    const request = new Request('http://localhost', {
      method: 'POST',
      body: '{"id":"evt_1","type":"checkout.session.completed"}',
      headers: { 'stripe-signature': 'invalid_signature' }
    });

    await expect(verifyStripeWebhook(request, 'whsec_secret')).rejects.toThrow(BillingError);
    try {
      await verifyStripeWebhook(request, 'whsec_secret');
    } catch (err) {
      expect(err).toBeInstanceOf(BillingError);
      expect((err as BillingError).code).toBe('webhook_signature_invalid');
    }
  });

  it('throws when stripe-signature header is missing', async () => {
    const request = new Request('http://localhost', {
      method: 'POST',
      body: '{"id":"evt_1","type":"checkout.session.completed"}'
    });

    await expect(verifyStripeWebhook(request, 'whsec_secret')).rejects.toThrow(BillingError);
  });
});

describe('handleStripeWebhookEvent', () => {
  it('no-ops for unhandled event type', async () => {
    const onCheckout = vi.fn();
    const onSubscriptionUpdated = vi.fn();
    const callbacks = { onCheckoutSessionCompleted: onCheckout, onSubscriptionUpdated };
    const event = {
      id: 'evt_1',
      type: 'unknown.event.type',
      data: { object: {} }
    } as never;
    const getStripe = vi.fn();

    await handleStripeWebhookEvent(event, callbacks, { getStripe });

    expect(onCheckout).not.toHaveBeenCalled();
    expect(onSubscriptionUpdated).not.toHaveBeenCalled();
    expect(getStripe).not.toHaveBeenCalled();
  });

  it('calls onSubscriptionUpdated for customer.subscription.updated', async () => {
    const onSubscriptionUpdated = vi.fn().mockResolvedValue(undefined);
    const event = {
      id: 'evt_1',
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_1',
          customer: 'cus_1',
          status: 'active',
          currency: 'usd',
          current_period_start: 1000000000,
          current_period_end: 1000000000 + 30 * 24 * 3600,
          cancel_at_period_end: false,
          trial_start: null,
          trial_end: null,
          metadata: { organizationId: 'org_1' },
          items: {
            data: [
              {
                id: 'si_1',
                quantity: 1,
                price: {
                  id: 'price_1',
                  product: 'prod_1',
                  unit_amount: 1000,
                  recurring: { interval: 'month', interval_count: 1 },
                  type: 'recurring'
                }
              }
            ]
          }
        }
      }
    } as never;
    const getStripe = vi.fn();

    await handleStripeWebhookEvent(
      event,
      { onSubscriptionUpdated },
      { getStripe }
    );

    expect(onSubscriptionUpdated).toHaveBeenCalledTimes(1);
    const payload = onSubscriptionUpdated.mock.calls[0][0];
    expect(payload.subscriptionId).toBe('sub_1');
    expect(payload.customerId).toBe('cus_1');
    expect(payload.status).toBe('active');
    expect(payload.organizationId).toBe('org_1');
    expect(getStripe).not.toHaveBeenCalled();
  });

  it('calls onCustomerDeleted for customer.deleted', async () => {
    const onCustomerDeleted = vi.fn().mockResolvedValue(undefined);
    const event = {
      id: 'evt_1',
      type: 'customer.deleted',
      data: { object: { id: 'cus_deleted_1' } }
    } as never;
    const getStripe = vi.fn();

    await handleStripeWebhookEvent(event, { onCustomerDeleted }, { getStripe });

    expect(onCustomerDeleted).toHaveBeenCalledTimes(1);
    expect(onCustomerDeleted).toHaveBeenCalledWith('cus_deleted_1');
  });
});
