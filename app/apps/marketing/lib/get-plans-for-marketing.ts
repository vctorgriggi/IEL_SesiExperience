import 'server-only';

import {
  billingConfig,
  PriceInterval,
  type Plan,
  type Price,
  type Product
} from '@workspace/billing/marketing';

export type PlanForMarketing = {
  id: string;
  name: string;
  description: string;
  displayMonthly: string;
  displayYearly: string;
  priceLabelMonthly: string;
  priceLabelYearly: string;
  cta: string;
  ctaHref: string;
  highlighted: boolean;
  features: readonly string[];
  isEnterprise: boolean;
  trialDays?: number;
};

function formatPrice(cost: number, currency: string): string {
  if (currency === 'BRL') return `R$ ${cost}`;
  return `${currency} ${cost}`;
}

function getPriceForInterval(
  product: Product,
  interval: PriceInterval
): { cost: number; currency: string } | null {
  const plan = product.plans.find((p: Plan) =>
    p.displayIntervals.includes(interval)
  );
  const price =
    plan?.prices?.find((pr: Price) => pr.interval === interval) ??
    plan?.prices?.[0];
  if (!price) return null;
  return { cost: price.cost, currency: price.currency };
}

export function getPlansForMarketing(
  dashboardSignUpUrl: string,
  contactHref: string
): PlanForMarketing[] {
  const plans: PlanForMarketing[] = [];

  for (const product of billingConfig.products) {
    if (product.hidden) continue;

    const monthPrice = getPriceForInterval(product, PriceInterval.Month);
    const yearPrice = getPriceForInterval(product, PriceInterval.Year);
    const oneTimePrice = product.plans
      .flatMap((p) => p.prices)
      .find((pr) => pr.interval === undefined);

    const monthlyCost = monthPrice?.cost ?? oneTimePrice?.cost ?? null;
    const yearlyCost =
      yearPrice?.cost ?? (product.isFree ? 0 : (oneTimePrice?.cost ?? null));
    const currency =
      monthPrice?.currency ??
      yearPrice?.currency ??
      oneTimePrice?.currency ??
      'BRL';

    let priceLabelMonthly = 'por mês';
    let priceLabelYearly = 'por mês (anual)';
    if (product.isFree) {
      priceLabelMonthly = 'sempre gratuito';
      priceLabelYearly = 'sempre gratuito';
    } else if (product.isEnterprise) {
      priceLabelMonthly = 'Sob consulta';
      priceLabelYearly = 'Sob consulta';
    } else if (oneTimePrice) {
      priceLabelMonthly = 'pagamento único';
      priceLabelYearly = 'pagamento único';
    }

    const displayMonthly = product.isEnterprise
      ? 'Sob consulta'
      : monthlyCost !== null
        ? formatPrice(monthlyCost, currency)
        : '—';
    const displayYearly = product.isEnterprise
      ? 'Sob consulta'
      : yearlyCost !== null
        ? formatPrice(yearlyCost, currency)
        : '—';

    const trialDays = product.plans.find((p) => p.trialDays)?.trialDays;
    const cta = product.isEnterprise
      ? 'Fale conosco'
      : product.isFree
        ? product.label
        : trialDays
          ? `Teste grátis de ${trialDays} dias`
          : product.label;
    const ctaHref = product.isEnterprise ? contactHref : dashboardSignUpUrl;

    plans.push({
      id: product.id,
      name: product.name,
      description: product.description,
      displayMonthly,
      displayYearly,
      priceLabelMonthly,
      priceLabelYearly,
      cta,
      ctaHref,
      highlighted: product.recommended ?? false,
      features: product.features,
      isEnterprise: product.isEnterprise ?? false,
      trialDays
    });
  }

  return plans;
}
