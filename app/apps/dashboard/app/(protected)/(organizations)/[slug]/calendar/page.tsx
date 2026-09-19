import { CalendarView } from '@/components/calendar/calendar-view';
import { DashboardPageLayout } from '@/components/dashboard/dashboard-page-layout';
import { getCalendarEvents } from '@/features/events/data/get-calendar-events';

import { getAuthOrganizationContext } from '@workspace/auth/context';
import { routes } from '@workspace/routes';

export default async function OrganizationCalendarPage({
  searchParams
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const ctx = await getAuthOrganizationContext();
  const slug = ctx.organization.slug;
  const { month: monthParam } = await searchParams;
  const now = new Date();
  const month =
    monthParam && /^\d{4}-\d{2}$/.test(monthParam)
      ? monthParam
      : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  let items: Awaited<ReturnType<typeof getCalendarEvents>> = [];
  try {
    items = await getCalendarEvents(month);
  } catch {
    // API unreachable
  }

  const breadcrumb = [
    {
      label: 'Início',
      href: routes.dashboard.org(slug).home
    },
    { label: 'Calendário' }
  ];

  return (
    <DashboardPageLayout
      title="Calendário"
      breadcrumb={breadcrumb}
    >
      <CalendarView
        key={month}
        initialMonth={month}
        initialItems={items}
      />
    </DashboardPageLayout>
  );
}
