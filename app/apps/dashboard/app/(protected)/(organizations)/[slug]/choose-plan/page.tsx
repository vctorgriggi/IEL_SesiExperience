import { redirect } from 'next/navigation';
import { ChoosePlanCard } from '@/components/choose-plan/choose-plan-card';
import { DashboardPageLayout } from '@/components/dashboard/dashboard-page-layout';
import { getPlansForDisplay } from '@/features/billing/data/get-plans-for-display';
import { getUserOrganizations } from '@/features/organizations/data/get-user-organizations';

import { getAuthOrganizationContext } from '@workspace/auth/context';
import { resolveOrganizationPlanId } from '@workspace/billing';
import { routes } from '@workspace/routes';

export default async function ChoosePlanPage() {
  const [ctx, organizations] = await Promise.all([
    getAuthOrganizationContext(),
    getUserOrganizations()
  ]);

  const slug = ctx.organization.slug;
  const currentPlan = resolveOrganizationPlanId(ctx.organization);

  if (organizations.length > 1) {
    redirect(routes.dashboard.org(slug).home);
  }

  if (currentPlan !== 'free') {
    redirect(routes.dashboard.org(slug).billing.index);
  }

  const plans = getPlansForDisplay();
  const breadcrumb = [
    {
      label: 'Início',
      href: routes.dashboard.org(slug).home
    },
    { label: 'Escolher plano' }
  ];

  return (
    <DashboardPageLayout
      title="Escolher plano"
      breadcrumb={breadcrumb}
    >
      <div className="mx-auto max-w-5xl">
        <ChoosePlanCard
          slug={slug}
          currentPlan={currentPlan}
          plans={plans}
        />
      </div>
    </DashboardPageLayout>
  );
}
