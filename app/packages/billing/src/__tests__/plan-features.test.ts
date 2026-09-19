import { describe, it, expect } from 'vitest';
import { canUseFeature, getMaxMembersForPlan } from '../plan-features';

describe('plan-features', () => {
  it('derives feature access from the catalog', () => {
    expect(canUseFeature('free', 'invite_members')).toBe(false);
    expect(canUseFeature('pro', 'invite_members')).toBe(true);
    expect(canUseFeature('lifetime', 'multiple_members')).toBe(true);
  });

  it('derives max members from the catalog', () => {
    expect(getMaxMembersForPlan('free')).toBe(1);
    expect(getMaxMembersForPlan('pro')).toBeGreaterThan(1);
  });
});
