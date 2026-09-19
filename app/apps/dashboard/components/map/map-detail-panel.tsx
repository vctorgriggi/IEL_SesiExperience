'use client';

import Link from 'next/link';
import type { LocationEventItem } from '@/features/events/data/get-event-locations';
import {
  getEditEventPath,
  getEventAttendeesPath,
  getEventPath
} from '@/features/events/routing/event-navigation';
import {
  ArrowRight01Icon,
  Calendar01Icon,
  Edit02Icon,
  PinLocation03Icon,
  UserMultipleIcon
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState
} from '@workspace/ui';

type ItemWithCoords = LocationEventItem & { lat: number; lng: number };

type MapDetailPanelProps = {
  selectedItem: ItemWithCoords | null;
  currentOrgSlug: string | null;
};

export function MapDetailPanel({
  selectedItem,
  currentOrgSlug
}: MapDetailPanelProps) {
  if (!selectedItem) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center bg-muted/20 px-6">
        <EmptyState
          title="Selecione um evento no mapa"
          description="Clique em um marcador para ver os detalhes do evento aqui."
          className="text-muted-foreground"
        />
      </div>
    );
  }

  const eventPath = currentOrgSlug
    ? getEventPath(selectedItem.id, currentOrgSlug)
    : null;
  const editPath = currentOrgSlug
    ? getEditEventPath(selectedItem.id, currentOrgSlug)
    : null;
  const attendeesPath = currentOrgSlug
    ? getEventAttendeesPath(selectedItem.id, currentOrgSlug)
    : null;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-auto border-l border-border bg-background">
      <div className="shrink-0 border-b border-border bg-muted/20 px-5 py-3">
        <p className="text-sm font-medium text-muted-foreground">
          Evento selecionado
        </p>
      </div>
      <div className="flex-1 overflow-auto p-5">
        <Card
          variant="default"
          padding="default"
          className="w-full"
        >
          <CardHeader className="space-y-1 pb-2">
            <CardTitle className="text-lg font-semibold leading-tight text-foreground">
              {selectedItem.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 text-sm">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <HugeiconsIcon
                  icon={Calendar01Icon}
                  size={20}
                />
              </span>
              <div>
                <p className="font-medium text-foreground">Data</p>
                <p className="text-muted-foreground">
                  {format(
                    new Date(selectedItem.date),
                    "EEEE, d 'de' MMMM 'de' yyyy",
                    {
                      locale: ptBR
                    }
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 text-sm">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <HugeiconsIcon
                  icon={UserMultipleIcon}
                  size={20}
                />
              </span>
              <div>
                <p className="font-medium text-foreground">Inscrições</p>
                <p className="text-muted-foreground">
                  {selectedItem.registrations}{' '}
                  {selectedItem.registrations === 1 ? 'inscrito' : 'inscritos'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 text-sm">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <HugeiconsIcon
                  icon={PinLocation03Icon}
                  size={20}
                />
              </span>
              <div>
                <p className="font-medium text-foreground">Localização</p>
                <p className="text-muted-foreground">
                  {selectedItem.lat.toFixed(5)}, {selectedItem.lng.toFixed(5)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {eventPath && (
                <Link href={eventPath}>
                  <Button
                    size="small"
                    type="button"
                    className="btn-primary gap-1.5"
                  >
                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      size={16}
                    />
                    Ver evento
                  </Button>
                </Link>
              )}
              {editPath && (
                <Link href={editPath}>
                  <Button
                    size="small"
                    type="button"
                    severity="secondary"
                    outlined
                    className="gap-1.5"
                  >
                    <HugeiconsIcon
                      icon={Edit02Icon}
                      size={16}
                    />
                    Editar
                  </Button>
                </Link>
              )}
              {attendeesPath && (
                <Link href={attendeesPath}>
                  <Button
                    size="small"
                    type="button"
                    severity="secondary"
                    text
                    className="gap-1.5"
                  >
                    <HugeiconsIcon
                      icon={UserMultipleIcon}
                      size={16}
                    />
                    Inscritos
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
