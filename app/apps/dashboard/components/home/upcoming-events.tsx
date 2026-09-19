import Link from 'next/link';
import { getEventPath } from '@/features/events/routing/event-navigation';
import type { UpcomingEventItem } from '@/features/events/types';
import type { Permissions } from '@/features/members/permissions';
import { LinkSquare01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { cn } from '@workspace/ui';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Rascunho',
  published: 'Publicado',
  cancelled: 'Cancelado',
  completed: 'Concluído'
};

export type HomeUpcomingEventsProps = {
  upcomingEvents: UpcomingEventItem[];
  orgSlug?: string | null;
  permissions: Permissions;
};

export function HomeUpcomingEvents({
  upcomingEvents,
  orgSlug,
  permissions
}: HomeUpcomingEventsProps) {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Próximos eventos
        </h2>
      </div>
      {upcomingEvents.length === 0 ? (
        <div className="rounded-xl border border-border/60 bg-muted/20 py-12 text-center">
          <p className="text-sm text-muted-foreground">Nenhum evento próximo</p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {upcomingEvents.slice(0, 6).map((event) => (
            <li key={event.id}>
              <Link
                href={getEventPath(event.id, orgSlug)}
                className={cn(
                  'group flex flex-col rounded-xl border border-border/80 bg-card p-5',
                  'transition-colors duration-150 hover:border-border hover:bg-muted/30',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary">
                    {event.name}
                  </h3>
                  <span
                    className="shrink-0 rounded-full p-1.5 text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary"
                    aria-hidden
                  >
                    <HugeiconsIcon
                      icon={LinkSquare01Icon}
                      size={18}
                    />
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {format(new Date(event.date), "EEEE, d 'de' MMM", {
                    locale: ptBR
                  })}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>
                    {event.registrations}
                    {event.capacity != null ? ` / ${event.capacity}` : ''}{' '}
                    inscritos
                  </span>
                  {permissions.viewRevenue && (
                    <span>
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                        maximumFractionDigits: 0
                      }).format(event.revenue / 100)}
                    </span>
                  )}
                </div>
                <span className="mt-3 inline-flex w-fit rounded-md bg-muted/80 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {STATUS_LABELS[event.status] ?? event.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
