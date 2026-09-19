import type { ReactNode } from 'react';

export type BillingInterval = 'monthly' | 'yearly';

export type PricingPlanCtaLink = {
  type: 'link';
  href: string;
  label: string;
};

export type PricingPlanCtaAction = {
  type: 'action';
  label: string;
  onClick: () => void;
  loading?: boolean;
};

export type PricingPlanCta = PricingPlanCtaLink | PricingPlanCtaAction;

export type PricingPlanItem = {
  id: string;
  name: string;
  description: string;
  displayPriceMonthly: string;
  displayPriceYearly: string;
  priceLabelMonthly: string;
  priceLabelYearly: string;
  features: string[];
  highlighted?: boolean;
  icon?: ReactNode;
  cta: PricingPlanCta;
  isCurrent?: boolean;
};

export type PricingGridProps = {
  plans: PricingPlanItem[];
  billingInterval: BillingInterval;
  onBillingIntervalChange: (value: BillingInterval) => void;
  useNewSwitcher?: boolean;
  cardsContainerClassName?: string;
  cardClassName?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  promoBanner?: ReactNode;
  trustBadges?: ReactNode;
  labels?: { monthly: string; yearly: string };
};
