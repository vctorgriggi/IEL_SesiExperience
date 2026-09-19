import type {
  EventRegistrationDto,
  EventWithRegistrationsDto
} from '@/features/events/types';
import { UserMultipleIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@workspace/ui';

import { ExportRegistrationsCsvButton } from './export-registrations-csv-button';

type EventRegistrationsProps = {
  event: EventWithRegistrationsDto;
};

export function EventRegistrations({ event }: EventRegistrationsProps) {
  const registrations = event.registrations || [];
  const confirmedCount = registrations.filter(
    (r) => r.status === 'confirmed'
  ).length;
  const pendingCount = registrations.filter(
    (r) => r.status === 'pending'
  ).length;
  const cancelledCount = registrations.filter(
    (r) => r.status === 'cancelled'
  ).length;

  const statusBadgeStyles: Record<string, string> = {
    pending:
      'rounded-lg bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400',
    confirmed:
      'rounded-lg bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary',
    cancelled:
      'rounded-lg bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive',
    waitlist:
      'rounded-lg bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground'
  };

  const statusLabels = {
    pending: 'Pendente',
    confirmed: 'Confirmado',
    cancelled: 'Cancelado',
    waitlist: 'Lista de Espera'
  } as const;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-base font-medium">Inscrições</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {registrations.length} inscrições totais
            </CardDescription>
          </div>
          <ExportRegistrationsCsvButton
            eventId={event.id}
            eventTitle={event.title}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-5 pt-0">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-2xl font-semibold text-[#1D8A4E]">
              {confirmedCount}
            </div>
            <p className="text-xs text-muted-foreground">Confirmados</p>
          </div>
          <div>
            <div className="text-2xl font-semibold text-amber-600">
              {pendingCount}
            </div>
            <p className="text-xs text-muted-foreground">Pendentes</p>
          </div>
          <div>
            <div className="text-2xl font-semibold text-destructive">
              {cancelledCount}
            </div>
            <p className="text-xs text-muted-foreground">Cancelados</p>
          </div>
        </div>

        {event.maxAttendees && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Capacidade</span>
              <span className="font-medium text-foreground">
                {confirmedCount} / {event.maxAttendees}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-primary transition-all"
                style={{
                  width: `${Math.min((confirmedCount / event.maxAttendees) * 100, 100)}%`
                }}
              />
            </div>
          </div>
        )}

        {registrations.length > 0 ? (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground">
              Participantes
            </h4>
            <div className="overflow-hidden rounded-xl border border-border/80">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/80 bg-muted/30">
                    <th className="p-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Nome
                    </th>
                    <th className="p-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Email
                    </th>
                    <th className="p-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Status
                    </th>
                    <th className="p-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Data de Inscrição
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((registration: EventRegistrationDto) => (
                    <tr
                      key={registration.id}
                      className="border-b border-border/60 last:border-0"
                    >
                      <td className="p-3 font-medium text-foreground">
                        {registration.guestName ??
                          registration.user?.name ??
                          '—'}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {registration.guestEmail ??
                          registration.user?.email ??
                          '—'}
                      </td>
                      <td className="p-3">
                        <span
                          className={
                            statusBadgeStyles[registration.status] ??
                            statusBadgeStyles.pending
                          }
                        >
                          {
                            statusLabels[
                              registration.status as keyof typeof statusLabels
                            ]
                          }
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {registration.createdAt
                          ? new Date(registration.createdAt).toLocaleDateString(
                              'pt-BR'
                            )
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <HugeiconsIcon
              icon={UserMultipleIcon}
              size={40}
              className="text-muted-foreground/50"
            />
            <p className="mt-2 text-sm text-muted-foreground">
              Nenhuma inscrição ainda
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
