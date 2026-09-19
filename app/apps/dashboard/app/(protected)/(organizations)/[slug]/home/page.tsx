import { DashboardPageLayout } from '@/components/dashboard/dashboard-page-layout';
import { HomeChartInscricoes } from '@/components/home/chart-inscricoes';
import { HomeChartRevenue } from '@/components/home/chart-revenue';
import { HomeGreeting } from '@/components/home/greeting';
import { HomeMetricas } from '@/components/home/metricas';
import { HomeOnboardingCards } from '@/components/home/onboarding-cards';
import { HomePeriodFilter } from '@/components/home/period-filter';
import { HomeUpcomingEvents } from '@/components/home/upcoming-events';
import { hasNoMetricsYet, PERIOD_LABELS } from '@/components/home/utils';
import { DashboardOnboardingBanner } from '@/components/layout/dashboard-onboarding-banner';
import { getUpcomingEvents } from '@/features/events/data/get-upcoming-events';
import { getChartRegistrations } from '@/features/home/data/get-chart-registrations';
import { getChartRevenue } from '@/features/home/data/get-chart-revenue';
import { getDashboardStats } from '@/features/home/data/get-dashboard-stats';
import { getCurrentMembership } from '@/features/members/data/get-current-membership';
import { can } from '@/features/members/permissions';

import { getAuthOrganizationContext } from '@workspace/auth/context';
import { cn } from '@workspace/ui';

const PERIOD_TO_DAYS: Record<string, number> = {
  '1d': 1,
  '7d': 7,
  '15d': 15,
  '30d': 30
};

const DEFAULT_PERIOD = '30d';

type OrganizationHomePageProps = {
  searchParams: Promise<{ period?: string }>;
};

export default async function OrganizationHomePage({
  searchParams
}: OrganizationHomePageProps) {
  const ctx = await getAuthOrganizationContext();
  const { period = DEFAULT_PERIOD } = await searchParams;
  const periodDays = PERIOD_TO_DAYS[period] ?? PERIOD_TO_DAYS[DEFAULT_PERIOD];
  const currentOrgSlug = ctx.organization.slug;
  const userName = ctx.session.user.name ?? ctx.session.user.email ?? null;

  const [stats, chartRegistrations, chartRevenue, upcomingEvents, membership] =
    await Promise.all([
      getDashboardStats(periodDays, currentOrgSlug),
      getChartRegistrations(periodDays, currentOrgSlug),
      getChartRevenue(periodDays, currentOrgSlug),
      getUpcomingEvents(10, currentOrgSlug),
      getCurrentMembership()
    ]);
  const permissions = can(membership);

  const registrationsChartData = chartRegistrations.map((p) => ({
    month: p.date,
    value: p.count
  }));
  const revenueChartData = chartRevenue.map((p) => ({
    month: p.date,
    value: p.amount / 100
  }));

  const totalRegistrationsInPeriod = registrationsChartData.reduce(
    (sum, d) => sum + d.value,
    0
  );
  const totalRevenueInPeriod = revenueChartData.reduce(
    (sum, d) => sum + d.value,
    0
  );

  const empty = hasNoMetricsYet(stats, upcomingEvents);
  const showHeroRow = userName != null && period != null;
  const periodLabel = PERIOD_LABELS[period] ?? 'Últimos 30 dias';

  return (
    <DashboardPageLayout
      title="Painel"
      showGreeting
    >
      <DashboardOnboardingBanner empty={empty}>
        <HomeOnboardingCards
          orgSlug={currentOrgSlug}
          permissions={permissions}
        />
      </DashboardOnboardingBanner>

      {showHeroRow ? (
        <div className="mb-6 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <HomeGreeting
              userName={userName}
              variant="hero"
            />

            <HomePeriodFilter currentPeriod={period} />
          </div>
        </div>
      ) : period != null ? (
        <div className="mb-4 flex justify-end">
          <HomePeriodFilter currentPeriod={period} />
        </div>
      ) : null}

      <HomeMetricas
        stats={stats}
        permissions={permissions}
      />

      <div
        className={cn(
          'grid gap-6',
          permissions.viewRevenue ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
        )}
      >
        <HomeChartInscricoes
          data={registrationsChartData}
          periodLabel={periodLabel}
          totalInPeriod={totalRegistrationsInPeriod}
        />
        {permissions.viewRevenue && (
          <HomeChartRevenue
            data={revenueChartData}
            periodLabel={periodLabel}
            totalInPeriod={totalRevenueInPeriod}
          />
        )}
      </div>

      <HomeUpcomingEvents
        upcomingEvents={upcomingEvents}
        orgSlug={currentOrgSlug}
        permissions={permissions}
      />
    </DashboardPageLayout>
  );
}
