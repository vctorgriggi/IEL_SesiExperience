import { CurrentPlanCard } from '@/components/settings/billing/current-plan-card';
import { DeleteOrganizationSection } from '@/components/settings/billing/delete-organization-section';
import { SettingsPageHeader } from '@/components/settings/layout/settings-page-header';
import { getPlansForDisplay } from '@/features/billing/data/get-plans-for-display';
import { isActiveSubscription } from '@/features/billing/data/is-active-subscription';

import { getAuthOrganizationContext } from '@workspace/auth/context';
import { resolveOrganizationPlanId } from '@workspace/billing';

export default async function OrganizationBillingPage() {
  const ctx = await getAuthOrganizationContext();
  const slug = ctx.organization.slug;
  const organizationName = ctx.organization.name;

  const plans = getPlansForDisplay();
  const currentPlan = resolveOrganizationPlanId(ctx.organization);

  const activeSubscription =
    ctx.organization.subscriptions?.find((s) => isActiveSubscription(s)) ?? null;
  const hasActiveSubscription = !!activeSubscription;

  return (
    <div className="max-w-2xl space-y-8">
      <SettingsPageHeader
        title="Cobrança"
        description="Gerencie seu plano e assinatura. Altere ou cancele quando quiser."
      />

      <CurrentPlanCard
        slug={slug}
        organizationName={organizationName}
        currentPlan={currentPlan}
        hasActiveSubscription={hasActiveSubscription}
        activeSubscription={
          activeSubscription as {
            periodStartsAt?: string;
            periodEndsAt?: string;
          } | null
        }
        plans={plans}
      />

      <DeleteOrganizationSection />
    </div>
  );
}
