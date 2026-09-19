'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { CalendarEventItem } from '@/features/events/data/get-calendar-events';
import {
  getEditEventPath,
  getEventPath
} from '@/features/events/routing/event-navigation';
import { useCurrentOrganizationSlug } from '@/hooks/use-current-organization-slug';
import { ArrowLeft01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  addMonths,
  format,
  getDay,
  isSameDay,
  lastDayOfMonth,
  setDate,
  startOfMonth,
  subMonths
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { routes } from '@workspace/routes';
import { Button, cn, Dialog } from '@workspace/ui';

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const STATUS_LABELS: Record<string, string> = {
  draft: 'Rascunho',
  published: 'Publicado',
  cancelled: 'Cancelado',
  completed: 'Concluído'
};

function capitalizeFirst(str: string): string {
  return str.replace(/^\w/, (c) => c.toUpperCase());
}

type CalendarViewProps = {
  initialMonth: string;
  initialItems: CalendarEventItem[];
};

export function CalendarView({
  initialMonth,
  initialItems
}: CalendarViewProps) {
  const router = useRouter();
  const currentOrgSlug = useCurrentOrganizationSlug();
  const today = useMemo(() => new Date(), []);

  const calendarBase = currentOrgSlug
    ? routes.dashboard.org(currentOrgSlug).calendar.index
    : routes.dashboard.onboarding.index;

  const [currentMonth, setCurrentMonth] = useState(() => {
    const [y, m] = initialMonth.split('-').map(Number);
    return new Date(y, m - 1, 1);
  });

  const [selectedEvent, setSelectedEvent] = useState<CalendarEventItem | null>(
    null
  );

  const itemsByDay = useMemo(() => {
    const map = new Map<string, CalendarEventItem[]>();
    for (const item of initialItems) {
      const key = item.date.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return map;
  }, [initialItems]);

  const grid = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const leadingEmpty = getDay(monthStart);
    const totalDays = lastDayOfMonth(currentMonth).getDate();
    const rows = Math.ceil((leadingEmpty + totalDays) / 7);
    return { leadingEmpty, totalDays, rows };
  }, [currentMonth]);

  const navigate = useCallback(
    (next: Date) => {
      setCurrentMonth(next);
      router.push(`${calendarBase}?month=${format(next, 'yyyy-MM')}`);
    },
    [calendarBase, router]
  );

  const monthLabel = capitalizeFirst(
    format(currentMonth, 'MMMM yyyy', { locale: ptBR })
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex shrink-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {monthLabel}
          </h2>
          <Button
            outlined
            size="small"
            onClick={() => navigate(startOfMonth(today))}
          >
            Hoje
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <Button
            outlined
            size="small"
            onClick={() => navigate(subMonths(currentMonth, 1))}
            aria-label="Mês anterior"
          >
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              size={18}
              className="text-current"
            />
          </Button>
          <Button
            outlined
            size="small"
            onClick={() => navigate(addMonths(currentMonth, 1))}
            aria-label="Próximo mês"
          >
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              size={18}
              className="text-current"
            />
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm flex flex-col">
        <div
          className="grid w-full flex-1 min-h-0 overflow-hidden"
          role="grid"
          aria-label="Calendário mensal"
          style={{
            gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
            gridTemplateRows: `auto repeat(${grid.rows}, minmax(0, 1fr))`
          }}
        >
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="min-w-0 border-b border-border/50 bg-muted/30 py-3 text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
            >
              {label}
            </div>
          ))}

          {Array.from({ length: grid.rows * 7 }, (_, i) => {
            const dayNumber = i - grid.leadingEmpty + 1;
            const isEmpty = dayNumber < 1 || dayNumber > grid.totalDays;
            const cellDate = isEmpty ? null : setDate(currentMonth, dayNumber);
            const dayKey = cellDate ? format(cellDate, 'yyyy-MM-dd') : null;
            const dayItems = dayKey ? (itemsByDay.get(dayKey) ?? []) : [];
            const isToday = cellDate !== null && isSameDay(cellDate, today);

            return (
              <div
                key={i}
                className={cn(
                  'flex min-h-0 min-w-0 flex-col border-b border-r border-border p-2 transition-colors last:border-r-0 sm:p-3',
                  isEmpty ? 'bg-muted/20' : 'bg-card',
                  isToday && 'bg-primary/5'
                )}
              >
                {!isEmpty && (
                  <>
                    <div
                      className={cn(
                        'mb-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm font-medium transition-colors',
                        isToday
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                      )}
                    >
                      {dayNumber}
                    </div>
                    <ul className="min-h-0 flex-1 space-y-1 overflow-hidden">
                      {dayItems.map((ev) => (
                        <li
                          key={ev.id}
                          className="min-w-0"
                        >
                          <button
                            type="button"
                            className="group block w-full rounded-lg border-l-4 px-2 py-1 text-left text-xs font-medium shadow-sm truncate transition-all hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1"
                            style={{
                              borderLeftColor: ev.color,
                              backgroundColor: `${ev.color}18`,
                              color: ev.color
                            }}
                            onClick={() => setSelectedEvent(ev)}
                            title={ev.name}
                          >
                            <span className="block truncate text-foreground group-hover:underline">
                              {ev.name}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {selectedEvent && (
        <Dialog
          visible
          onHide={() => setSelectedEvent(null)}
          header={
            <div className="flex flex-col gap-2">
              <div
                className="h-1 w-12 rounded-full"
                style={{ backgroundColor: selectedEvent.color }}
              />
              <span className="text-lg font-semibold tracking-tight text-foreground">
                {selectedEvent.name}
              </span>
            </div>
          }
          className="w-full max-w-sm"
          footer={
            <div className="flex flex-wrap gap-2">
              <Link href={getEventPath(selectedEvent.id, currentOrgSlug)}>
                <Button
                  size="small"
                  type="button"
                  className="rounded-lg"
                >
                  Ver evento
                </Button>
              </Link>
              <Link href={getEditEventPath(selectedEvent.id, currentOrgSlug)}>
                <Button
                  outlined
                  severity="secondary"
                  size="small"
                  type="button"
                  className="rounded-lg border-border/60"
                >
                  Editar
                </Button>
              </Link>
            </div>
          }
        >
          <p className="text-sm text-muted-foreground">
            {capitalizeFirst(
              format(new Date(selectedEvent.date), "EEEE, d 'de' MMMM", {
                locale: ptBR
              })
            )}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {STATUS_LABELS[selectedEvent.status] ?? selectedEvent.status}
          </p>
        </Dialog>
      )}
    </div>
  );
}
