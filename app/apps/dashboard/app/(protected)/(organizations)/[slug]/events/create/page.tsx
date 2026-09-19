import Link from 'next/link';
import { DashboardPageLayout } from '@/components/dashboard/dashboard-page-layout';
import { EventForm } from '@/components/events/form/event-form';
import { getEventsIndexPath } from '@/features/events/routing/event-navigation';
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { routes } from '@workspace/routes';

type CreateEventPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function CreateEventPage({
  params
}: CreateEventPageProps) {
  const { slug: currentOrgSlug } = await params;
  const eventsIndexPath = getEventsIndexPath(currentOrgSlug);
  const breadcrumb = currentOrgSlug
    ? [
        {
          label: 'Início',
          href: routes.dashboard.org(currentOrgSlug).home
        },
        { label: 'Eventos', href: eventsIndexPath },
        { label: 'Criar evento' }
      ]
    : [{ label: 'Eventos' }, { label: 'Criar evento' }];

  return (
    <DashboardPageLayout
      title="Criar evento"
      breadcrumb={breadcrumb}
    >
      <div className="w-full space-y-5 sm:space-y-6">
        <header className="max-w-2xl space-y-3">
          <div>
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
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Criar evento
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Preencha os dados do evento para começar a receber inscrições
            </p>
          </div>
        </header>

        <EventForm />
      </div>
    </DashboardPageLayout>
  );
}
