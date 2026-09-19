import { Suspense } from 'react';

import { Card, CardDescription, CardHeader, CardTitle } from '@workspace/ui';

import { DashboardPageLayout } from '@/components/dashboard/dashboard-page-layout';
import { PublicEventCard } from '@/components/events/public/public-event-card';
import { EventsSearchForm } from '@/components/events/public/events-search-form';
import { getPublicEvents } from '@/features/events/data/get-public-events';
import { getEventsIndexPath } from '@/features/events/routing/event-navigation';
import { getAuthOrganizationContext } from '@workspace/auth/context';
import { routes } from '@workspace/routes';

type PublicEventsPageProps = {
  searchParams: Promise<{ search?: string }>;
};

export default async function PublicEventsPage({ searchParams }: PublicEventsPageProps) {
  const ctx = await getAuthOrganizationContext();
  const slug = ctx.organization.slug;
  const { search } = await searchParams;
  const events = await getPublicEvents({ search });

  const breadcrumb = [
    { label: 'Início', href: routes.dashboard.org(slug).home },
    { label: 'Eventos', href: getEventsIndexPath(slug) },
    { label: 'Eventos públicos' }
  ];

  return (
    <DashboardPageLayout title="Eventos Públicos" breadcrumb={breadcrumb}>
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Descubra e participe</h2>
          <p className="text-sm text-muted-foreground">
            Explore eventos incríveis
          </p>
        </div>

        <div className="flex gap-4">
          <EventsSearchForm />
        </div>
      </div>

      <Suspense fallback={<div>Carregando eventos...</div>}>
        {events.length === 0 ? (
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Nenhum evento encontrado</CardTitle>
              <CardDescription>
                {search
                  ? 'Nenhum evento corresponde à sua busca.'
                  : 'Não há eventos públicos disponíveis no momento.'}
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <PublicEventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </Suspense>
    </DashboardPageLayout>
  );
}
