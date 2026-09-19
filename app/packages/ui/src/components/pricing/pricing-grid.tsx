'use client';

import { CheckmarkBadge04Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import NumberFlow from '@number-flow/react';

import { cn } from '../../lib/utils';
import { Button } from '../actions/button';
import { Switcher } from '../forms/switcher';
import type {
  BillingInterval,
  PricingGridProps,
  PricingPlanItem
} from './types';

const defaultLabels = {
  monthly: 'Cobrança mensal',
  yearly: 'Cobrança anual'
};

const CTA_LINK_CLASSNAME =
  'mt-6 inline-flex h-[var(--control-height-md)] w-full items-center justify-center rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors duration-150 hover:bg-primary/90';

type ParsedAnimatedPrice = {
  prefix: string;
  value: number;
  hasDecimals: boolean;
};

function parseAnimatedPrice(displayPrice: string): ParsedAnimatedPrice | null {
  const trimmedPrice = displayPrice.trim();
  const match = trimmedPrice.match(/^([^\d-]*?)\s*(-?\d[\d.,]*)$/u);
  if (!match) return null;

  const [, rawPrefix, rawNumeric] = match;
  let normalized = rawNumeric;
  const lastComma = rawNumeric.lastIndexOf(',');
  const lastDot = rawNumeric.lastIndexOf('.');

  if (lastComma >= 0 && lastDot >= 0) {
    const commaIsDecimal = lastComma > lastDot;
    const decimalSeparator = commaIsDecimal ? ',' : '.';
    const thousandSeparator = commaIsDecimal ? '.' : ',';
    normalized = rawNumeric
      .replaceAll(thousandSeparator, '')
      .replace(decimalSeparator, '.');
  } else if (lastComma >= 0) {
    const fractionLength = rawNumeric.length - lastComma - 1;
    normalized =
      fractionLength === 3
        ? rawNumeric.replaceAll(',', '')
        : rawNumeric.replace(',', '.');
  } else if (lastDot >= 0) {
    const fractionLength = rawNumeric.length - lastDot - 1;
    normalized =
      fractionLength === 3 ? rawNumeric.replaceAll('.', '') : rawNumeric;
  }

  const numericValue = Number(normalized.replace(/[^\d.-]/g, ''));
  if (!Number.isFinite(numericValue)) return null;

  return {
    prefix: rawPrefix.trim(),
    value: numericValue,
    hasDecimals: !Number.isInteger(numericValue)
  };
}

function PlanCard({
  plan,
  billingInterval,
  className
}: {
  plan: PricingPlanItem;
  billingInterval: BillingInterval;
  className?: string;
}) {
  const yearly = billingInterval === 'yearly';
  const displayPrice = yearly
    ? plan.displayPriceYearly
    : plan.displayPriceMonthly;
  const priceLabel = yearly ? plan.priceLabelYearly : plan.priceLabelMonthly;
  const isEnterprise = displayPrice === 'Sob consulta';
  const parsedPrice = parseAnimatedPrice(displayPrice);
  const shouldAnimatePrice = !isEnterprise && parsedPrice !== null;
  const highlighted = plan.highlighted === true || plan.id === 'pro';

  return (
    <div
      className={cn(
        'w-full',
        highlighted
          ? 'ui-pricing-card--highlighted'
          : 'ui-pricing-card relative flex flex-col bg-card p-8',
        className
      )}
    >
      <div
        className={cn(
          highlighted
            ? 'ui-pricing-card__inner flex h-full flex-col bg-card p-8'
            : 'relative flex flex-1 flex-col'
        )}
      >
        {plan.icon != null && (
          <div className="mb-5 size-8 text-foreground [&_svg]:size-8 [&_svg]:shrink-0 [&_svg]:text-foreground">
            {plan.icon}
          </div>
        )}
        <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>

        <div className="mt-6 flex flex-wrap items-baseline gap-x-1.5 gap-y-1 leading-none">
          {!shouldAnimatePrice ? (
            <p className="text-4xl font-bold tracking-tight text-foreground">
              {displayPrice}
            </p>
          ) : (
            <>
              {parsedPrice.prefix.length > 0 && (
                <span className="text-lg font-semibold tracking-tight text-foreground/80">
                  {parsedPrice.prefix}
                </span>
              )}
              <NumberFlow
                value={parsedPrice.value}
                locales="pt-BR"
                format={{
                  minimumFractionDigits: parsedPrice.hasDecimals ? 2 : 0,
                  maximumFractionDigits: parsedPrice.hasDecimals ? 2 : 0
                }}
                className="text-4xl font-bold tracking-tight text-foreground [font-variant-numeric:tabular-nums]"
              />
            </>
          )}
          {!isEnterprise && (
            <span className="text-sm font-medium text-muted-foreground">
              /{priceLabel}
            </span>
          )}
        </div>

        {plan.cta.type === 'link' ? (
          <a
            href={plan.cta.href}
            className={CTA_LINK_CLASSNAME}
          >
            {plan.cta.label}
          </a>
        ) : (
          <Button
            type="button"
            className="mt-6 w-full rounded-full"
            size="medium"
            disabled={plan.cta.loading}
            onClick={plan.cta.onClick}
          >
            {plan.cta.loading ? '...' : plan.cta.label}
          </Button>
        )}

        <ul className="mt-6 flex-1 space-y-3">
          {plan.features.map((feature) => (
            <li
              key={feature}
              className="flex items-start gap-3 text-sm text-muted-foreground"
            >
              <HugeiconsIcon
                icon={CheckmarkBadge04Icon}
                size={20}
              />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function PricingGrid({
  plans,
  billingInterval,
  onBillingIntervalChange,
  useNewSwitcher = false,
  cardsContainerClassName,
  cardClassName,
  title,
  subtitle,
  description,
  promoBanner,
  trustBadges,
  labels = defaultLabels
}: PricingGridProps) {
  const yearly = billingInterval === 'yearly';
  const switcher = useNewSwitcher ? (
    <Switcher
      options={[
        { label: labels.monthly, value: 'monthly' },
        { label: labels.yearly, value: 'yearly' }
      ]}
      value={billingInterval}
      onValueChange={onBillingIntervalChange}
      ariaLabel="Intervalo de cobrança"
      className="justify-center"
    />
  ) : (
    <div className="flex items-center justify-center gap-3">
      <span
        className={cn(
          'text-sm font-medium',
          !yearly ? 'text-foreground' : 'text-muted-foreground'
        )}
      >
        {labels.monthly}
      </span>
      <label className="ui-pricing-toggle">
        <input
          type="checkbox"
          checked={yearly}
          onChange={() =>
            onBillingIntervalChange(yearly ? 'monthly' : 'yearly')
          }
          aria-label="Alternar cobrança anual"
        />
        <span className="ui-pricing-toggle__slider" />
      </label>
      <span
        className={cn(
          'text-sm font-medium',
          yearly ? 'text-foreground' : 'text-muted-foreground'
        )}
      >
        {labels.yearly}
      </span>
    </div>
  );

  return (
    <>
      {(title != null || subtitle != null || description != null) && (
        <div className="mb-12 text-center">
          {title != null && (
            <span className="inline-block rounded-full bg-surface-muted px-4 py-1.5 text-xs font-medium text-muted-foreground">
              {title}
            </span>
          )}
          {subtitle != null && (
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">
              {subtitle}
            </h2>
          )}
          {description != null && (
            <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
              {description}
            </p>
          )}

          <div className="mt-8">{switcher}</div>
        </div>
      )}

      {title == null && subtitle == null && description == null && (
        <div className="mb-8">{switcher}</div>
      )}

      <div className={cn('justify-center flex', cardsContainerClassName)}>
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            billingInterval={billingInterval}
            className={cardClassName}
          />
        ))}
      </div>

      {promoBanner != null && (
        <div className="ui-pricing-card mx-auto mt-8 flex max-w-3xl flex-nowrap items-center justify-between gap-4 bg-card p-5">
          {promoBanner}
        </div>
      )}

      {trustBadges != null && (
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-sm text-muted-foreground">
          {trustBadges}
        </div>
      )}
    </>
  );
}
