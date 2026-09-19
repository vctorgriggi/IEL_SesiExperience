import { DashboardPageLayout } from '@/components/dashboard/dashboard-page-layout';
import { MapView } from '@/components/map/map-view';
import { getEventsLocations } from '@/features/events/data/get-event-locations';

import { getAuthOrganizationContext } from '@workspace/auth/context';
import { routes } from '@workspace/routes';

export default async function OrganizationMapPage() {
  const ctx = await getAuthOrganizationContext();
  const slug = ctx.organization.slug;

  let items: Awaited<ReturnType<typeof getEventsLocations>> = [];
  try {
    items = await getEventsLocations();
  } catch {
    // API unreachable
  }

  const withCoords = items.filter(
    (e): e is typeof e & { lat: number; lng: number } =>
      e.lat != null && e.lng != null
  );

  const breadcrumb = [
    {
      label: 'Início',
      href: routes.dashboard.org(slug).home
    },
    { label: 'Mapa' }
  ];

  return (
    <DashboardPageLayout
      title="Mapa"
      breadcrumb={breadcrumb}
    >
      <MapView items={withCoords} />
    </DashboardPageLayout>
  );
}
