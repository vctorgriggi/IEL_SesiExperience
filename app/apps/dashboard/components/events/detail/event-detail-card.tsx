import Link from 'next/link';
import type { EventDto } from '@/features/events/types';
import { ArrowLeft01Icon, Calendar01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { Card } from '@workspace/ui';

import { EventActions } from './event-actions';
import { EventStatusBadge } from './event-status-badge';

type EventDetailCardProps = {
  event: EventDto;
};

function EventDetailItem({
  label,
  value
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-1 basis-0 flex-col py-1 pr-4 first:pl-0 sm:px-4 last:pl-4 last:pr-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="mt-0.5 text-base font-medium text-foreground">
        {value}
      </span>
    </div>
  );
}

export function EventDetailCard({ event }: EventDetailCardProps) {
  const description =
    event.description && event.description.length > 80
      ? `${event.description.slice(0, 80)}...`
      : (event.description ?? `Evento #${event.id.slice(0, 8)}`);

  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);

  return (
    <Card className="shadow-none">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="flex mb-2 items-center gap-2 text-foreground transition-colors hover:text-foreground/80"
        >
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            size={18}
            className="shrink-0"
          />
          <span className="text-sm font-medium sm:text-base">Voltar</span>
        </Link>
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
        <div className="flex shrink-0">
          {event.imageUrl ? (
            <img
              src={event.imageUrl}
              alt={event.title}
              className="size-16 rounded-lg object-cover sm:size-20"
            />
          ) : (
            <div className="flex size-16 items-center justify-center rounded-lg bg-muted sm:size-20">
              <HugeiconsIcon
                icon={Calendar01Icon}
                size={28}
                className="text-muted-foreground sm:text-3xl"
              />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {event.title}
            </h1>
            <EventStatusBadge status={event.status} />
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <EventActions event={event} />
      </div>

      <div className="mt-6 flex flex-wrap divide-x divide-border/80 border-t border-border/60 pt-5">
        <EventDetailItem
          label="Data"
          value={startDate.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          })}
        />
        <EventDetailItem
          label="Horário"
          value={
            <>
              {startDate.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
              })}{' '}
              –{' '}
              {endDate.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </>
          }
        />
        <EventDetailItem
          label="Local"
          value={event.location ?? '—'}
        />
        <EventDetailItem
          label="Tipo"
          value={event.isPublic ? 'Público' : 'Privado'}
        />
      </div>
    </Card>
  );
}
