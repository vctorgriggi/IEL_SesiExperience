import { billingConfig, type PlanId } from './config';

export const PLAN_FEATURES = ['invite_members', 'multiple_members'] as const;
export type PlanFeature = (typeof PLAN_FEATURES)[number];

function findProduct(planId: PlanId) {
  return billingConfig.products.find((p) => p.id === planId);
}

export function canUseFeature(planId: PlanId, feature: PlanFeature): boolean {
  const product = findProduct(planId);
  if (!product) return false;
  return product.access.features.includes(feature);
}

export function getMaxMembersForPlan(planId: PlanId): number {
  const product = findProduct(planId);
  return product?.access.maxMembers ?? 1;
}
