export type EventStatusFilter =
  | 'draft'
  | 'published'
  | 'cancelled'
  | 'completed';
export const EVENTS_PAGE_SIZE = 6;

export type EventsListFilters = {
  status: EventStatusFilter | undefined;
  search: string | undefined;
  startDate: Date | undefined;
  endDate: Date | undefined;
  page: number;
};

const VALID_STATUSES = new Set<EventStatusFilter>([
  'draft',
  'published',
  'cancelled',
  'completed'
]);

const MONTH_START_DAY = 1;
const LAST_DAY_OF_MONTH = 0;
const END_OF_DAY = [23, 59, 59] as const;

type DateRange = { startDate: Date | undefined; endDate: Date | undefined };
type RangeFactory = (start?: string, end?: string) => DateRange;

const EMPTY_RANGE: DateRange = { startDate: undefined, endDate: undefined };

const DATE_RANGE_BY_PERIOD: Record<string, RangeFactory> = {
  '7': () => ({ startDate: new Date(), endDate: addDays(new Date(), 7) }),
  '15': () => ({ startDate: new Date(), endDate: addDays(new Date(), 15) }),
  month: () => {
    const now = new Date();
    return {
      startDate: new Date(now.getFullYear(), now.getMonth(), MONTH_START_DAY),
      endDate: new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        LAST_DAY_OF_MONTH,
        ...END_OF_DAY
      )
    };
  },
  custom: (start, end) => ({
    startDate: start ? new Date(start) : undefined,
    endDate: end ? new Date(end) : undefined
  })
};

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function getString(v: string | string[] | undefined): string | undefined {
  return typeof v === 'string' ? v : undefined;
}

export function getDateRangeFromPeriod(
  period: string | null,
  startParam: string | null,
  endParam: string | null
): DateRange {
  return (
    DATE_RANGE_BY_PERIOD[period ?? '']?.(
      startParam ?? undefined,
      endParam ?? undefined
    ) ?? EMPTY_RANGE
  );
}

export function parseEventsSearchParams(
  params: Record<string, string | string[] | undefined>
): EventsListFilters {
  const statusParam = getString(params.status);
  const pageParam = getString(params.page);
  const { startDate, endDate } = getDateRangeFromPeriod(
    getString(params.period) ?? null,
    getString(params.startDate) ?? null,
    getString(params.endDate) ?? null
  );

  return {
    status: VALID_STATUSES.has(statusParam as EventStatusFilter)
      ? (statusParam as EventStatusFilter)
      : undefined,
    search: getString(params.search),
    page: Math.max(1, parseInt(pageParam ?? '1', 10) || 1),
    startDate,
    endDate
  };
}
