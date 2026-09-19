import { BillingPortalButton } from '@/components/settings/billing/billing-portal-button';
import { ChangePlanDialog } from '@/components/settings/billing/change-plan-dialog';
import {
  toPlanConfig,
  type PlanDisplayFromServer
} from '@/features/billing/plans-config';
import { Tick01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import type { PlanId } from '@workspace/billing';
import { cn } from '@workspace/ui';

type Subscription = {
  periodStartsAt?: string;
  periodEndsAt?: string;
};

type CurrentPlanCardProps = {
  slug: string;
  organizationName: string;
  currentPlan: PlanId;
  hasActiveSubscription: boolean;
  activeSubscription?: Subscription | null;
  plans: PlanDisplayFromServer[];
};

export function CurrentPlanCard({
  slug,
  organizationName,
  currentPlan,
  hasActiveSubscription,
  plans
}: CurrentPlanCardProps) {
  const planConfigs = plans.map(toPlanConfig);
  const planConfig =
    planConfigs.find((p) => p.id === currentPlan) ?? planConfigs[0];
  const Icon = planConfig.icon;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Plano atual
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Crédito na conta se você precisar fazer downgrade durante o ciclo de
          cobrança.
        </p>
      </div>

      <div
        className={cn(
          'flex flex-wrap items-center justify-between gap-4 rounded-xl border px-5 py-4',
          hasActiveSubscription ? 'border-primary/50' : 'border-border'
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <span
            className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-lg',
              planConfig.iconClassName
            )}
          >
            <HugeiconsIcon
              icon={Icon}
              size={24}
              className={planConfig.iconClassName}
            />
          </span>
          <div className="min-w-0">
            <p className="font-medium text-foreground">
              Plano atual: {planConfig.name}
            </p>
          </div>
          {hasActiveSubscription && (
            <span className="flex size-6 shrink-0 items-center justify-center rounded bg-primary text-primary-content">
              <HugeiconsIcon
                icon={Tick01Icon}
                size={14}
                className="text-primary-content"
              />
            </span>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <ChangePlanDialog
            slug={slug}
            organizationName={organizationName}
            currentPlan={currentPlan}
            plans={plans}
          />
          {hasActiveSubscription && <BillingPortalButton slug={slug} />}
        </div>
      </div>
    </section>
  );
}
