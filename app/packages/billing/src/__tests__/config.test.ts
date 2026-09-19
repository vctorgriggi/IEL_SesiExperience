import { describe, it, expect } from 'vitest';
import {
  billingConfig,
  PLAN_IDS,
  isPlanId,
  billingConfigDisplayIntervals
} from '../config';
import { PriceInterval } from '../schema';

describe('billingConfig', () => {
  it('uses canonical plan ids', () => {
    expect(PLAN_IDS).toEqual(['free', 'pro', 'lifetime', 'enterprise']);

    for (const planId of PLAN_IDS) {
      expect(isPlanId(planId)).toBe(true);
    }

    expect(isPlanId('team')).toBe(false);
    expect(isPlanId('individual')).toBe(false);
  });

  it('products include serializable display/cta/access metadata', () => {
    for (const product of billingConfig.products) {
      expect(product.display).toBeDefined();
      expect(product.cta).toBeDefined();
      expect(product.access).toBeDefined();
      expect(typeof product.display.iconClassName).toBe('string');
      expect(typeof product.cta.kind).toBe('string');
      expect(Array.isArray(product.access.features)).toBe(true);
      expect(typeof product.access.maxMembers).toBe('number');
    }
  });

  it('exposes display intervals derived from the catalog', () => {
    expect(billingConfigDisplayIntervals).toContain(PriceInterval.Month);
    expect(billingConfigDisplayIntervals).toContain(PriceInterval.Year);
  });

  it('has free product', () => {
    const free = billingConfig.products.find((p) => p.id === 'free');
    expect(free).toBeDefined();
    expect(free?.isFree).toBe(true);
  });
});
