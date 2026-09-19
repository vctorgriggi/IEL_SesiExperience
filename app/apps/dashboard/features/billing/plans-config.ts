import {
  CrownIcon,
  Diamond01Icon,
  Tag01Icon,
  User02Icon
} from '@hugeicons/core-free-icons';

import type { PlanId } from '@workspace/billing';

export type BillingInterval = 'monthly' | 'yearly';

export type PlanCtaFromServer =
  | { kind: 'checkout'; label: string }
  | { kind: 'start'; label: string }
  | { kind: 'link'; label: string; href?: string };

export type PlanDisplayFromServer = {
  id: PlanId;
  name: string;
  description: string;
  priceMonthly: string;
  priceYearly: string;
  priceSuffixMonthly: string;
  priceSuffixYearly: string;
  iconClassName: string;
  badge?: string;
  featured?: boolean;
  features: string[];
  cta: PlanCtaFromServer;
};

export type PlanConfig = PlanDisplayFromServer & {
  icon: typeof User02Icon;
};

export const PLAN_ICONS: Record<PlanId, PlanConfig['icon']> = {
  free: User02Icon,
  pro: Diamond01Icon,
  lifetime: CrownIcon,
  enterprise: Tag01Icon
};

export function toPlanConfig(server: PlanDisplayFromServer): PlanConfig {
  return { ...server, icon: PLAN_ICONS[server.id] };
}
