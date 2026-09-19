import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DashboardPageLayout } from '@/components/dashboard/dashboard-page-layout';
import { EventForm } from '@/components/events/form/event-form';
import { getEventById } from '@/features/events/data/get-event-by-id';
import {
  getEventPath,
  getEventsIndexPath
} from '@/features/events/routing/event-navigation';
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { getAuthOrganizationContext } from '@workspace/auth/context';
import { routes } from '@workspace/routes';

type EditEventPageProps = {
  params: Promise<{ slug: string; id: string }>;
};

export default async function EditEventPage({ params }: EditEventPageProps) {
  const { id } = await params;
  const ctx = await getAuthOrganizationContext();
  const slug = ctx.organization.slug;
  const eventsIndexPath = getEventsIndexPath(slug);
  const event = await getEventById(id);

  if (!event) {
    notFound();
  }

  const breadcrumb = [
    {
      label: 'Início',
      href: routes.dashboard.org(slug).home
    },
    { label: 'Eventos', href: eventsIndexPath },
    { label: event.title, href: getEventPath(event.id, slug) },
    { label: 'Editar' }
  ];

  return (
    <DashboardPageLayout
      title="Editar evento"
      breadcrumb={breadcrumb}
    >
      <div className="w-full space-y-5 sm:space-y-6">
        <header className="max-w-2xl space-y-3">
          <Link
            href={eventsIndexPath}
            className="inline-flex min-h-11 items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground sm:min-h-0"
          >
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              size={16}
            />
            Voltar para eventos
          </Link>
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Editar Evento
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Atualize as informações do seu evento sem sair do fluxo.
            </p>
          </div>
        </header>

        <EventForm event={event} />
      </div>
    </DashboardPageLayout>
  );
}
