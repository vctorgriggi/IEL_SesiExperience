import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DashboardPageLayout } from '@/components/dashboard/dashboard-page-layout';
import { getEventById } from '@/features/events/data/get-event-by-id';
import { getEventTicketTypes } from '@/features/events/data/get-event-ticket-types';
import {
  getEventPath,
  getEventsIndexPath
} from '@/features/events/routing/event-navigation';

import { routes } from '@workspace/routes';

import { EventTicketTypesManager } from './event-ticket-types-manager';

type TicketsPageProps = {
  params: Promise<{ slug: string; id: string }>;
};

export default async function EventTicketsPage({ params }: TicketsPageProps) {
  const { slug: currentOrgSlug, id } = await params;
  const [event, ticketTypes] = await Promise.all([
    getEventById(id),
    getEventTicketTypes(id)
  ]);

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
        { label: event.title, href: getEventPath(event.id, currentOrgSlug) },
        { label: 'Ingressos' }
      ]
    : [{ label: 'Eventos' }, { label: event.title }, { label: 'Ingressos' }];

  return (
    <DashboardPageLayout
      title="Ingressos"
      breadcrumb={breadcrumb}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Tipos de ingresso — {event.title}
            </h2>
            <p className="text-muted-foreground">
              Crie e gerencie os tipos de ingresso (nome, preço, quantidade)
            </p>
          </div>
          <Link
            href={getEventPath(event.id, currentOrgSlug)}
            className="outline"
          >
            Voltar ao evento
          </Link>
        </div>
        <EventTicketTypesManager
          eventId={event.id}
          initialTicketTypes={ticketTypes}
        />
      </div>
    </DashboardPageLayout>
  );
}
