import { billingConfig, isPlanId, type PlanId } from './config';

type PurchaseItem = {
  productId?: string | null;
  variantId?: string | null;
  model?: string | null;
};

type SubscriptionRow = {
  active?: boolean | null;
  status?: string | null;
  items?: PurchaseItem | PurchaseItem[] | null;
};

type OrderRow = {
  status?: string | null;
  items?: PurchaseItem | PurchaseItem[] | null;
};

export type OrganizationForPlanResolution = {
  subscriptions?: SubscriptionRow[] | null;
  orders?: OrderRow[] | null;
};

const LEGACY_PLAN_ALIASES: Record<string, PlanId> = {
  individual: 'free',
  team: 'pro',
  monthly: 'pro',
  yearly: 'pro'
};

const PRICE_ID_TO_PLAN_ID = new Map<string, PlanId>();

for (const product of billingConfig.products) {
  const productId = product.id as PlanId;
  for (const plan of product.plans) {
    for (const price of plan.prices) {
      PRICE_ID_TO_PLAN_ID.set(price.id, productId);
    }
  }
}

function normalizeCandidate(value: string | null | undefined): PlanId | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (isPlanId(trimmed)) return trimmed;
  return LEGACY_PLAN_ALIASES[trimmed] ?? undefined;
}

function normalizeFromPriceId(
  priceId: string | null | undefined
): PlanId | undefined {
  if (!priceId) return undefined;
  return PRICE_ID_TO_PLAN_ID.get(priceId) ?? undefined;
}

function toItems(
  items: PurchaseItem | PurchaseItem[] | null | undefined
): PurchaseItem[] {
  if (!items) return [];
  return Array.isArray(items) ? items : [items];
}

function isActiveSubscription(sub: SubscriptionRow): boolean {
  if (sub.active != null) return sub.active === true;
  const status = (sub.status ?? '').toLowerCase();
  return status === 'active' || status === 'trialing';
}

function isSuccessfulOrder(order: OrderRow): boolean {
  const status = (order.status ?? '').toLowerCase();
  return (
    status === 'paid' ||
    status === 'succeeded' ||
    status === 'completed' ||
    status === 'complete'
  );
}

function resolveItemPlanId(item: PurchaseItem): PlanId | undefined {
  return (
    normalizeCandidate(item.productId) ??
    normalizeCandidate(item.model) ??
    normalizeFromPriceId(item.variantId)
  );
}

function planPriority(planId: PlanId): number {
  switch (planId) {
    case 'enterprise':
      return 4;
    case 'lifetime':
      return 3;
    case 'pro':
      return 2;
    case 'free':
      return 1;
  }
}

export function resolveOrganizationPlanId(
  organization: OrganizationForPlanResolution
): PlanId {
  const found = new Set<PlanId>();

  for (const sub of organization.subscriptions ?? []) {
    if (!sub || !isActiveSubscription(sub)) continue;
    for (const item of toItems(sub.items)) {
      const planId = resolveItemPlanId(item);
      if (planId) found.add(planId);
    }
  }

  for (const order of organization.orders ?? []) {
    if (!order || !isSuccessfulOrder(order)) continue;
    for (const item of toItems(order.items)) {
      const planId = resolveItemPlanId(item);
      if (planId) found.add(planId);
    }
  }

  let best: PlanId = 'free';
  for (const planId of found) {
    if (planPriority(planId) > planPriority(best)) best = planId;
  }

  return best;
}
