import 'server-only';

import type { PlanDisplayFromServer } from '@/features/billing/plans-config';

import {
  billingConfig,
  isPlanId,
  PriceInterval,
  PriceType
} from '@workspace/billing';

function formatPrice(cost: number, currency: string): string {
  if (currency === 'BRL') return 'R\u0024 ' + cost;
  return currency + ' ' + cost;
}

function findRecurringPrice(productId: string, interval: PriceInterval) {
  const product = billingConfig.products.find((p) => p.id === productId);
  if (!product) return null;

  for (const plan of product.plans) {
    for (const price of plan.prices) {
      if (price.type === PriceType.Recurring && price.interval === interval) {
        return price;
      }
    }
  }

  return null;
}

function findOneTimePrice(productId: string) {
  const product = billingConfig.products.find((p) => p.id === productId);
  if (!product) return null;

  for (const plan of product.plans) {
    for (const price of plan.prices) {
      if (price.type === PriceType.OneTime) return price;
    }
  }

  return null;
}

export function getPlansForDisplay(): PlanDisplayFromServer[] {
  const plans: PlanDisplayFromServer[] = [];

  for (const product of billingConfig.products) {
    if (product.hidden) continue;
    if (!isPlanId(product.id)) continue;

    const monthPrice = findRecurringPrice(product.id, PriceInterval.Month);
    const yearPrice = findRecurringPrice(product.id, PriceInterval.Year);
    const oneTimePrice = findOneTimePrice(product.id);

    let priceMonthly = '—';
    let priceYearly = '—';

    if (product.cta.kind === 'link') {
      priceMonthly = 'Sob consulta';
      priceYearly = 'Sob consulta';
    } else if (oneTimePrice) {
      priceMonthly = formatPrice(oneTimePrice.cost, oneTimePrice.currency);
      priceYearly = priceMonthly;
    } else {
      if (monthPrice) {
        priceMonthly = formatPrice(monthPrice.cost, monthPrice.currency);
      }
      if (yearPrice) {
        priceYearly = formatPrice(yearPrice.cost, yearPrice.currency);
      } else {
        priceYearly = priceMonthly;
      }
    }

    plans.push({
      id: product.id,
      name: product.name,
      description: product.description,
      priceMonthly,
      priceYearly,
      priceSuffixMonthly: product.display.priceSuffixMonthly,
      priceSuffixYearly:
        product.display.priceSuffixYearly ?? product.display.priceSuffixMonthly,
      iconClassName: product.display.iconClassName,
      badge: product.display.badge,
      featured: product.display.featured ?? product.recommended,
      features: product.features,
      cta: product.cta
    });
  }

  return plans;
}
