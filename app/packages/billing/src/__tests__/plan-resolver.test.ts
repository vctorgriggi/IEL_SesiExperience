import { describe, it, expect } from 'vitest';
import { resolveOrganizationPlanId } from '../plan-resolver';
import { billingConfig } from '../config';
import { PriceInterval, PriceType } from '../schema';

describe('resolveOrganizationPlanId', () => {
  it('defaults to free with no purchases', () => {
    expect(resolveOrganizationPlanId({})).toBe('free');
  });

  it('resolves pro from an active subscription', () => {
    const planId = resolveOrganizationPlanId({
      subscriptions: [
        {
          active: true,
          items: { productId: 'pro' }
        }
      ]
    });

    expect(planId).toBe('pro');
  });

  it('resolves lifetime from a successful order', () => {
    const planId = resolveOrganizationPlanId({
      orders: [
        {
          status: 'paid',
          items: { productId: 'lifetime' }
        }
      ]
    });

    expect(planId).toBe('lifetime');
  });

  it('picks the highest priority entitlement', () => {
    const planId = resolveOrganizationPlanId({
      subscriptions: [
        {
          status: 'active',
          items: [{ productId: 'pro' }, { productId: 'enterprise' }]
        }
      ],
      orders: [{ status: 'paid', items: { productId: 'lifetime' } }]
    });

    expect(planId).toBe('enterprise');
  });

  it('supports legacy aliases', () => {
    const planId = resolveOrganizationPlanId({
      subscriptions: [
        {
          active: true,
          items: [{ productId: 'team' }, { model: 'yearly' }]
        }
      ]
    });

    expect(planId).toBe('pro');
  });

  it('supports legacy variantId (price id) lookups', () => {
    const pro = billingConfig.products.find((p) => p.id === 'pro');
    const proMonthlyPriceId = pro?.plans
      .flatMap((plan) => plan.prices)
      .find(
        (price) =>
          price.type === PriceType.Recurring &&
          price.interval === PriceInterval.Month
      )?.id;

    expect(proMonthlyPriceId).toBeTypeOf('string');

    const planId = resolveOrganizationPlanId({
      subscriptions: [
        {
          active: true,
          items: { variantId: proMonthlyPriceId }
        }
      ]
    });

    expect(planId).toBe('pro');
  });
});
