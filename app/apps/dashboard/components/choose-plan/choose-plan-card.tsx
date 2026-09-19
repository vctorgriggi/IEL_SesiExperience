'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  toPlanConfig,
  type BillingInterval,
  type PlanConfig,
  type PlanDisplayFromServer
} from '@/features/billing/plans-config';
import { useCheckout } from '@/features/billing/use-billing';
import { HugeiconsIcon } from '@hugeicons/react';

import type { PlanId } from '@workspace/billing';
import { routes } from '@workspace/routes';
import { PricingGrid, toast, type PricingPlanItem } from '@workspace/ui';

type ChoosePlanCardProps = {
  slug: string;
  organizationName?: string;
  currentPlan?: PlanId;
  plans: PlanDisplayFromServer[];
};

type CtaOpts = {
  slug: string;
  onCheckout: (productId: PlanId) => void;
  onGoHome: () => void;
  isCheckoutPending: boolean;
};

function resolveCta(plan: PlanConfig, isCurrent: boolean, opts: CtaOpts): PricingPlanItem['cta'] {
  if (isCurrent) return {
    type: 'action',
    label: 'Continuar com o atual',
    onClick: opts.onGoHome
  };

  if (plan.cta.kind === 'link') return {
    type: 'link',
    label: plan.cta.label,
    href: plan.cta.href ?? routes.dashboard.org(opts.slug).support.index
  };

  if (plan.cta.kind === 'start') return {
    type: 'action',
    label: plan.cta.label,
    onClick: opts.onGoHome
  };

  return {
    type: 'action',
    label: plan.cta.label,
    onClick: () => opts.onCheckout(plan.id),
    loading: opts.isCheckoutPending
  };
}

function toPricingPlanItems(
  plans: PlanConfig[],
  currentPlan: PlanId,
  opts: CtaOpts
): PricingPlanItem[] {
  return plans.map((plan) => {
    const isCurrent = currentPlan === plan.id;
    return {
      id: plan.id,
      name: plan.name,
      description: plan.description,
      displayPriceMonthly: plan.priceMonthly,
      displayPriceYearly: plan.priceYearly,
      priceLabelMonthly: plan.priceSuffixMonthly,
      priceLabelYearly: plan.priceSuffixYearly,
      features: plan.features,
      highlighted: plan.featured,
      icon: <HugeiconsIcon icon={plan.icon} size={32} className={plan.iconClassName} />,
      cta: resolveCta(plan, isCurrent, opts),
      isCurrent
    };
  });
}

export function ChoosePlanCard({
  slug,
  currentPlan = 'free',
  plans: plansProp
}: ChoosePlanCardProps) {
  const router = useRouter();
  const checkout = useCheckout(slug);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');

  const handleCheckout = async (productId: PlanId) => {
    try {
      await checkout.mutateAsync({
        productId,
        billingInterval: productId === 'pro' ? billingInterval : undefined
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao processar');
    }
  };

  const pricingPlans = toPricingPlanItems(
    plansProp.map(toPlanConfig),
    currentPlan,
    {
      slug,
      onCheckout: handleCheckout,
      onGoHome: () => router.push(routes.dashboard.org(slug).home),
      isCheckoutPending: checkout.isPending
    }
  );

  return (
    <PricingGrid
      plans={pricingPlans}
      billingInterval={billingInterval}
      onBillingIntervalChange={setBillingInterval}
      labels={{ monthly: 'Mensal', yearly: 'Anual' }}
    />
  );
}
