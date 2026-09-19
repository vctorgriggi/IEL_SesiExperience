import Link from 'next/link';
import { DashboardPageLayout } from '@/components/dashboard/dashboard-page-layout';
import { EventCard } from '@/components/events/list/event-card';
import { EventsListFilters } from '@/components/events/list/events-list-filters';
import { EventsPagination } from '@/components/events/list/events-pagination';
import { getEventsPaginated } from '@/features/events/data/get-events';
import {
  getCreateEventPath,
  getEventPath
} from '@/features/events/routing/event-navigation';
import {
  EVENTS_PAGE_SIZE,
  parseEventsSearchParams
} from '@/features/events/utils/events-filters';
import { Add01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { routes } from '@workspace/routes';

type EventsPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

type CreateEventButtonProps = {
  label: string;
  href: string;
  className?: string;
};

function CreateEventButton({ label, href, className }: CreateEventButtonProps) {
  return (
    <Link
      href={href}
      className={className}
    >
      <span className="inline-flex items-center gap-2">
        <HugeiconsIcon
          icon={Add01Icon}
          size={18}
        />
        {label}
      </span>
    </Link>
  );
}

function EventsEmptyState({ createEventHref }: { createEventHref: string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-6 py-12 text-center">
      <h3 className="text-lg font-semibold text-foreground">
        Nenhum evento encontrado
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Ajuste os filtros ou crie seu primeiro evento para gerenciar inscrições
        e participantes.
      </p>
      <Link
        href={createEventHref}
        className="mt-4 inline-flex"
      >
        Criar primeiro evento
      </Link>
    </div>
  );
}

export default async function EventsPage({
  params,
  searchParams
}: EventsPageProps) {
  const { slug: currentOrgSlug } = await params;
  const resolvedSearchParams = await searchParams;
  const filters = parseEventsSearchParams(resolvedSearchParams);
  const eventFilters = {
    status: filters.status,
    search: filters.search,
    startDate: filters.startDate,
    endDate: filters.endDate
  };
  const { events, total } = await getEventsPaginated(
    eventFilters,
    filters.page,
    EVENTS_PAGE_SIZE
  );
  const hasEvents = events.length > 0;
  const createEventHref = getCreateEventPath(currentOrgSlug);
  const breadcrumb = currentOrgSlug
    ? [
        {
          label: 'Início',
          href: routes.dashboard.org(currentOrgSlug).home
        },
        { label: 'Eventos' }
      ]
    : [{ label: 'Eventos' }];

  return (
    <DashboardPageLayout
      title="Eventos"
      breadcrumb={breadcrumb}
    >
      <div className="space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              Meus Eventos
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Gerencie seus eventos e acompanhe as inscrições
            </p>
          </div>
          <CreateEventButton
            label="Novo Evento"
            href={createEventHref}
          />
        </header>

        <EventsListFilters />

        {!hasEvents ? (
          <EventsEmptyState createEventHref={createEventHref} />
        ) : (
          <>
            <ul
              className="flex flex-col gap-4"
              role="list"
            >
              {events.map((event) => (
                <li key={event.id}>
                  <EventCard
                    event={event}
                    href={getEventPath(event.id, currentOrgSlug)}
                  />
                </li>
              ))}
            </ul>
            <EventsPagination
              total={total}
              currentPage={filters.page}
            />
          </>
        )}
      </div>
    </DashboardPageLayout>
  );
}
