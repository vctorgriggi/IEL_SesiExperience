import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DashboardPageLayout } from '@/components/dashboard/dashboard-page-layout';
import { EventActionButtons } from '@/components/events/detail/event-action-buttons';
import { EventAnalyticsCard } from '@/components/events/detail/event-analytics-card';
import { EventDetailCard } from '@/components/events/detail/event-detail-card';
import { EventRegistrations } from '@/components/events/registrations/event-registrations';
import { getEventById } from '@/features/events/data/get-event-by-id';
import { getEventsIndexPath } from '@/features/events/routing/event-navigation';
import { createTitle } from '@/lib/formatters';

import { routes } from '@workspace/routes';

type EventPageProps = {
  params: Promise<{ slug: string; id: string }>;
};

export async function generateMetadata({
  params
}: EventPageProps): Promise<Metadata> {
  const { id } = await params;
  const event = await getEventById(id);
  if (!event) {
    return { title: createTitle('Evento') };
  }
  const description =
    event.description?.slice(0, 160) ?? `Evento: ${event.title}`;
  return {
    title: createTitle(event.title),
    description,
    openGraph: {
      title: event.title,
      description,
      ...(event.imageUrl && {
        images: [{ url: event.imageUrl, alt: event.title }]
      })
    }
  };
}

export default async function EventPage({ params }: EventPageProps) {
  const { slug: currentOrgSlug, id } = await params;
  const event = await getEventById(id);

  if (!event) {
    notFound();
  }

  const breadcrumb = currentOrgSlug
    ? [
        {
          label: 'Início',
          href: routes.dashboard.org(currentOrgSlug).home
        },
        { label: 'Eventos', href: getEventsIndexPath(currentOrgSlug) },
        { label: event.title }
      ]
    : [{ label: 'Eventos' }, { label: event.title }];

  return (
    <DashboardPageLayout
      title={event.title}
      breadcrumb={breadcrumb}
    >
      <div className="space-y-8">
        <EventDetailCard event={event} />

        <div className="space-y-6">
          <EventAnalyticsCard event={event} />
          <EventRegistrations event={event} />
          <EventActionButtons eventId={event.id} />
        </div>
      </div>
    </DashboardPageLayout>
  );
}
