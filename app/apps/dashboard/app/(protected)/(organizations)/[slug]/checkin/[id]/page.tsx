import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CheckinScanner } from '@/components/checkin/checkin-scanner';
import { DashboardPageLayout } from '@/components/dashboard/dashboard-page-layout';
import { getEventById } from '@/features/events/data/get-event-by-id';
import {
  getEventPath,
  getEventsIndexPath
} from '@/features/events/routing/event-navigation';
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { routes } from '@workspace/routes';
import { Card } from '@workspace/ui';

type CheckinPageProps = {
  params: Promise<{ slug: string; id: string }>;
};

export default async function CheckinPage({ params }: CheckinPageProps) {
  const { slug: organizationSlug, id: eventId } = await params;
  const event = await getEventById(eventId);

  if (!event) {
    notFound();
  }

  const breadcrumb = organizationSlug
    ? [
        {
          label: 'Início',
          href: routes.dashboard.org(organizationSlug).home
        },
        { label: 'Eventos', href: getEventsIndexPath(organizationSlug) },
        { label: event.title, href: getEventPath(eventId, organizationSlug) },
        { label: 'Check-in' }
      ]
    : [{ label: 'Check-in' }];

  return (
    <DashboardPageLayout
      title="Check-in"
      breadcrumb={breadcrumb}
    >
      <div className="space-y-8">
        {/* Header card: back + context (same as event page) */}
        <Card>
          <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-5">
            <Link
              href={getEventPath(eventId, organizationSlug)}
              className="flex items-center gap-2 text-foreground transition-colors hover:text-foreground/80"
            >
              <HugeiconsIcon
                icon={ArrowLeft01Icon}
                size={18}
                className="shrink-0"
              />
              <span className="text-sm font-medium sm:text-base">
                Check-in — {event.title}
              </span>
            </Link>
          </div>
        </Card>

        <CheckinScanner
          eventId={eventId}
          eventTitle={event.title}
        />
      </div>
    </DashboardPageLayout>
  );
}
