import Link from 'next/link';
import type { EventDto } from '@/features/events/types';
import {
  Calendar01Icon,
  LinkSquare01Icon,
  Location01Icon
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { cn } from '@workspace/ui';

type EventCardProps = {
  event: EventDto;
  href: string;
};

const STATUS_CONFIG: Record<
  EventDto['status'],
  { label: string; className: string }
> = {
  draft: { label: 'Rascunho', className: 'bg-muted text-muted-foreground' },
  published: {
    label: 'Publicado',
    className: 'bg-primary/15 text-primary border border-primary/30'
  },
  cancelled: {
    label: 'Cancelado',
    className: 'bg-destructive/10 text-destructive border border-destructive/30'
  },
  completed: {
    label: 'Concluído',
    className: 'bg-muted text-muted-foreground border border-border'
  }
};

function EventDateBlock({ dateStr }: { dateStr: string }) {
  const date = new Date(dateStr);
  return (
    <div
      className="flex shrink-0 flex-col items-center justify-center rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 min-w-[72px]"
      aria-hidden
    >
      <span className="text-2xl font-bold leading-none text-foreground">
        {format(date, 'dd')}
      </span>
      <span className="mt-0.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {format(date, 'MMM', { locale: ptBR })}
      </span>
    </div>
  );
}

export function EventCard({ event, href }: EventCardProps) {
  const config = STATUS_CONFIG[event.status];
  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);
  const sameDay =
    format(startDate, 'yyyy-MM-dd') === format(endDate, 'yyyy-MM-dd');
  const dateRangeLabel = sameDay
    ? format(startDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR })
    : `${format(startDate, 'd MMM', { locale: ptBR })} – ${format(endDate, 'd MMM yyyy', { locale: ptBR })}`;

  return (
    <article
      className={cn(
        'flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-md',
        'sm:gap-6 sm:p-5'
      )}
    >
      <EventDateBlock dateStr={event.startDate} />
      <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
        <div className="min-w-0 flex-1 space-y-0.5">
          <h3 className="font-semibold text-foreground line-clamp-2">
            {event.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-1">
            {event.description ?? 'Sem descrição'}
          </p>
        </div>
        <span
          className={cn(
            'inline-flex w-fit shrink-0 rounded-full border px-3 py-1 text-xs font-medium',
            config.className
          )}
        >
          {config.label}
        </span>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <HugeiconsIcon
              icon={Calendar01Icon}
              size={16}
              className="shrink-0"
            />
            {dateRangeLabel}
          </span>
          {event.location && (
            <span className="flex items-center gap-1.5 line-clamp-1">
              <HugeiconsIcon
                icon={Location01Icon}
                size={16}
                className="shrink-0"
              />
              {event.location}
            </span>
          )}
        </div>
      </div>
      <Link
        href={href}
        className="shrink-0 text-white bg-primary flex rounded-xl gap-2"
        aria-label={`Ver detalhes de ${event.title}`}
      >
        <HugeiconsIcon
          icon={LinkSquare01Icon}
          size={16}
        />
        Ver detalhes
      </Link>
    </article>
  );
}
