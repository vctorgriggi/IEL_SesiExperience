'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { PlanForMarketing } from '@/lib/get-plans-for-marketing';
import {
  IconBolt,
  IconBuildingCommunity,
  IconCalendar,
  IconCreditCardOff,
  IconCrown,
  IconDatabase,
  IconLeaf
} from '@tabler/icons-react';
import { motion } from 'framer-motion';

import { PricingGrid, type PricingPlanItem } from '@workspace/ui';

const PLAN_ICONS = {
  free: IconLeaf,
  pro: IconBolt,
  lifetime: IconCrown,
  enterprise: IconBuildingCommunity
} as const;

function getPlanIcon(id: string) {
  const Icon = PLAN_ICONS[id as keyof typeof PLAN_ICONS] ?? IconLeaf;
  return Icon;
}

function PlanIconShape({ planId }: { planId: string }) {
  const Icon = getPlanIcon(planId);
  return (
    <Icon
      className="size-8 text-foreground/80"
      strokeWidth={1.75}
      aria-hidden
    />
  );
}

function toPricingPlanItems(plans: PlanForMarketing[]): PricingPlanItem[] {
  return plans.map((plan) => ({
    id: plan.id,
    name: plan.name,
    description: plan.description,
    displayPriceMonthly: plan.displayMonthly,
    displayPriceYearly: plan.displayYearly,
    priceLabelMonthly: plan.priceLabelMonthly,
    priceLabelYearly: plan.priceLabelYearly,
    features: [...plan.features],
    highlighted: plan.highlighted,
    icon: <PlanIconShape planId={plan.id} />,
    cta: {
      type: 'link',
      href: plan.ctaHref,
      label: plan.cta
    }
  }));
}

type PricingProps = {
  plans: PlanForMarketing[];
};

export function Pricing({ plans }: PricingProps) {
  const [yearly, setYearly] = useState(false);
  const billingInterval = yearly ? 'yearly' : 'monthly';
  const pricingPlans = useMemo(() => toPricingPlanItems(plans), [plans]);

  const promoBanner = (
    <>
      <p className="min-w-0 shrink text-sm text-muted-foreground sm:text-base">
        Programa para startups -{' '}
        <Link
          href="#contact"
          className="font-semibold text-foreground underline decoration-2 underline-offset-4 hover:opacity-80"
        >
          50% de desconto
        </Link>
      </p>
      <Link
        href="#contact"
        className="shrink-0 rounded-xl border border-border bg-white px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
      >
        Aplicar
      </Link>
    </>
  );

  const trustBadges = (
    <>
      <div className="flex items-center gap-2">
        <IconCalendar className="size-5 shrink-0 text-foreground/70" />
        <span>Teste grátis por 7 dias</span>
      </div>
      <div className="flex items-center gap-2">
        <IconCreditCardOff className="size-5 shrink-0 text-foreground/70" />
        <span>Sem cartão de crédito</span>
      </div>
      <div className="flex items-center gap-2">
        <IconDatabase className="size-5 shrink-0 text-foreground/70" />
        <span>Migração de dados inclusa</span>
      </div>
    </>
  );

  return (
    <section
      id="pricing"
      className="section-shell scroll-mt-24 py-24 lg:py-30"
    >
      <div className="w-full bg-white py-10 mx-auto px-7 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="w-full p-2 sm:p-3"
        >
          <PricingGrid
            plans={pricingPlans}
            billingInterval={billingInterval}
            onBillingIntervalChange={(v) => setYearly(v === 'yearly')}
            title="Preços e planos"
            subtitle="Planos desenhados para crescer com você"
            description="Estrutura de preço clara para acelerar seu lançamento hoje e sustentar seu crescimento amanhã."
            promoBanner={promoBanner}
            trustBadges={trustBadges}
          />
        </motion.div>
      </div>
    </section>
  );
}
