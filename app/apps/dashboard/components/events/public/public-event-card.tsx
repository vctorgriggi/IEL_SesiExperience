'use client';

import Link from 'next/link';
import type { EventDto } from '@/features/events/types';
import {
  Calendar01Icon,
  Location01Icon,
  UserAdd01Icon,
  UserMultipleIcon
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@workspace/ui';

type PublicEvent = Pick<
  EventDto,
  | 'id'
  | 'slug'
  | 'title'
  | 'description'
  | 'startDate'
  | 'location'
  | 'maxAttendees'
> & { createdBy?: { name?: string } };

type PublicEventCardProps = {
  event: PublicEvent;
};

export function PublicEventCard({ event }: PublicEventCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="space-y-1">
          <CardTitle className="line-clamp-2">{event.title}</CardTitle>
          <CardDescription className="line-clamp-2">
            {event.description || 'Sem descrição'}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <HugeiconsIcon
              icon={Calendar01Icon}
              size={16}
            />
            <span>
              {new Date(event.startDate).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              })}
            </span>
          </div>

          {event.location && (
            <div className="flex items-center gap-2">
              <HugeiconsIcon
                icon={Location01Icon}
                size={16}
              />
              <span className="line-clamp-1">{event.location}</span>
            </div>
          )}

          {event.maxAttendees && (
            <div className="flex items-center gap-2">
              <HugeiconsIcon
                icon={UserMultipleIcon}
                size={16}
              />
              <span>Máx. {event.maxAttendees} participantes</span>
            </div>
          )}

          <div className="text-xs">Organizado por {event.createdBy?.name}</div>
        </div>

        <div className="flex gap-2">
          <Link
            href={event.slug ? `/open-events/${event.slug}` : `/events/${event.id}`}
            className="btn btn-outline btn-sm flex-1"
          >
            Ver Detalhes
          </Link>
          <Link
            href={
              event.slug
                ? `/open-events/${event.slug}#inscrever`
                : `/events/${event.id}#inscrever`
            }
          >
            <Button
              
              type="button"
            >
              <HugeiconsIcon
                icon={UserAdd01Icon}
                size={16}
                className="mr-2"
              />
              Inscrever-se
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
