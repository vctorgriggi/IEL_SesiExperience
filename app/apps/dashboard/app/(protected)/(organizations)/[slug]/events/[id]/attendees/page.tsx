import { notFound } from 'next/navigation';
import { DashboardPageLayout } from '@/components/dashboard/dashboard-page-layout';
import { getEventById } from '@/features/events/data/get-event-by-id';
import {
  getEventParticipants,
  type GetEventParticipantsOptions
} from '@/features/events/data/get-event-participants';
import {
  getEventPath,
  getEventsIndexPath
} from '@/features/events/routing/event-navigation';

import { getAuthOrganizationContext } from '@workspace/auth/context';
import { routes } from '@workspace/routes';

import { AttendeesTable } from './attendees-table';
import { EventAttendeesExportButton } from './event-attendees-export-button';

const PAGE_SIZE = 20;

type AttendeesPageProps = {
  params: Promise<{ slug: string; id: string }>;
  searchParams: Promise<{ page?: string; status?: string }>;
};

export default async function AttendeesPage({
  params,
  searchParams
}: AttendeesPageProps) {
  const [{ id, slug }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams
  ]);
  const page = Math.max(0, parseInt(resolvedSearchParams.page ?? '0', 10) || 0);
  const statusFilter = resolvedSearchParams.status ?? 'all';
  const validStatuses = [
    'pending',
    'confirmed',
    'cancelled',
    'waitlist',
    'checked-in'
  ] as const;
  const status: GetEventParticipantsOptions['status'] =
    statusFilter === 'all' ||
    !validStatuses.includes(statusFilter as (typeof validStatuses)[number])
      ? undefined
      : (statusFilter as (typeof validStatuses)[number]);

  const ctx = await getAuthOrganizationContext();
  const organizationSlug = ctx.organization.slug ?? slug;

  const [event, participants] = await Promise.all([
    getEventById(id),
    getEventParticipants(id, {
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
      status
    })
  ]);

  if (!event) {
    notFound();
  }

  const totalPages = Math.ceil(participants.total / PAGE_SIZE);

  const breadcrumb = [
    {
      label: 'Início',
      href: routes.dashboard.org(organizationSlug).home
    },
    { label: 'Eventos', href: getEventsIndexPath(organizationSlug) },
    { label: event.title, href: getEventPath(event.id, organizationSlug) },
    { label: 'Inscritos' }
  ];

  return (
    <DashboardPageLayout
      title="Inscritos"
      breadcrumb={breadcrumb}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Participantes — {event.title}
            </h2>
            <p className="text-muted-foreground">
              Gerencie inscrições, exporte lista e marque check-in
            </p>
          </div>
          <EventAttendeesExportButton
            eventId={event.id}
            eventTitle={event.title}
          />
        </div>
        <AttendeesTable
          eventId={event.id}
          orgSlug={organizationSlug}
          data={participants}
          page={page}
          statusFilter={statusFilter}
          totalPages={totalPages}
          pageSize={PAGE_SIZE}
        />
      </div>
    </DashboardPageLayout>
  );
}
