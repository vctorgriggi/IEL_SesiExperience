import { describe, it, expect } from 'vitest';
import { resolveBillingCheckout } from '../checkout-resolver';
import { billingConfig } from '../config';
import { PriceInterval, PriceType } from '../schema';
import { BillingError } from '../errors';

describe('resolveBillingCheckout', () => {
  it('returns no-checkout for free', () => {
    expect(resolveBillingCheckout('free')).toEqual({
      kind: 'no-checkout',
      productId: 'free',
      reason: 'free'
    });
  });

  it('returns no-checkout for enterprise', () => {
    expect(resolveBillingCheckout('enterprise')).toEqual({
      kind: 'no-checkout',
      productId: 'enterprise',
      reason: 'enterprise'
    });
  });

  it('resolves Pro monthly', () => {
    const pro = billingConfig.products.find((p) => p.id === 'pro');
    expect(pro).toBeDefined();

    const expectedMonthlyPriceId = pro?.plans
      .flatMap((plan) => plan.prices)
      .find(
        (price) =>
          price.type === PriceType.Recurring &&
          price.interval === PriceInterval.Month
      )?.id;

    expect(expectedMonthlyPriceId).toBeTypeOf('string');

    const resolved = resolveBillingCheckout('pro', 'monthly');
    if (resolved.kind !== 'checkout') throw new Error('Expected checkout');

    expect(resolved.selection.productId).toBe('pro');
    expect(resolved.selection.priceType).toBe(PriceType.Recurring);
    expect(resolved.selection.priceInterval).toBe(PriceInterval.Month);
    expect(resolved.selection.priceId).toBe(expectedMonthlyPriceId);
  });

  it('requires interval for Pro', () => {
    expect(() => resolveBillingCheckout('pro')).toThrow(BillingError);
    expect(() => resolveBillingCheckout('pro')).toThrow(
      /Intervalo de cobrança obrigatório/
    );
  });

  it('resolves Pro yearly', () => {
    const pro = billingConfig.products.find((p) => p.id === 'pro');
    const expectedYearlyPriceId = pro?.plans
      .flatMap((plan) => plan.prices)
      .find(
        (price) =>
          price.type === PriceType.Recurring &&
          price.interval === PriceInterval.Year
      )?.id;

    expect(expectedYearlyPriceId).toBeTypeOf('string');

    const resolved = resolveBillingCheckout('pro', 'yearly');
    if (resolved.kind !== 'checkout') throw new Error('Expected checkout');

    expect(resolved.selection.productId).toBe('pro');
    expect(resolved.selection.priceType).toBe(PriceType.Recurring);
    expect(resolved.selection.priceInterval).toBe(PriceInterval.Year);
    expect(resolved.selection.priceId).toBe(expectedYearlyPriceId);
  });

  it('resolves Lifetime as one-time', () => {
    const lifetime = billingConfig.products.find((p) => p.id === 'lifetime');
    const expectedLifetimePriceId = lifetime?.plans
      .flatMap((plan) => plan.prices)
      .find((price) => price.type === PriceType.OneTime)?.id;

    expect(expectedLifetimePriceId).toBeTypeOf('string');

    const resolved = resolveBillingCheckout('lifetime', 'monthly');
    if (resolved.kind !== 'checkout') throw new Error('Expected checkout');

    expect(resolved.selection.productId).toBe('lifetime');
    expect(resolved.selection.priceType).toBe(PriceType.OneTime);
    expect(resolved.selection.priceInterval).toBeUndefined();
    expect(resolved.selection.priceId).toBe(expectedLifetimePriceId);
  });
});
