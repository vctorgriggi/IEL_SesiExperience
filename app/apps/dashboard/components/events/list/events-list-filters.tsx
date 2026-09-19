'use client';

import { useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getEventsIndexPath } from '@/features/events/routing/event-navigation';
import { useCurrentOrganizationSlug } from '@/hooks/use-current-organization-slug';
import { Search01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { cn, Input, Select, useDebouncedCallback } from '@workspace/ui';

import {
  buildEventsPath,
  readDateParam,
  setOrDeleteParam,
  toISOEnd,
  toISOStart
} from './events-list-filters-helpers';

const PERIOD_OPTIONS = [
  { value: '', label: 'Todos os períodos' },
  { value: '7', label: 'Próximos 7 dias' },
  { value: '15', label: 'Próximos 15 dias' },
  { value: 'month', label: 'Este mês' },
  { value: 'custom', label: 'Personalizado' }
] as const;

const STATUS_OPTIONS = [
  { value: '', label: 'Todas as categorias' },
  { value: 'draft', label: 'Rascunho' },
  { value: 'published', label: 'Publicado' },
  { value: 'cancelled', label: 'Cancelado' },
  { value: 'completed', label: 'Concluído' }
] as const;

type FilterUpdatePayload = {
  search?: string;
  status?: string;
  period?: string;
  startDate?: string;
  endDate?: string;
};

const QUERY_KEYS = {
  page: 'page',
  search: 'search',
  status: 'status',
  period: 'period',
  startDate: 'startDate',
  endDate: 'endDate'
} as const;

const filterInputClass =
  'h-10 rounded-xl border border-primary/30 bg-white text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none transition-colors';

function useEventFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentOrgSlug = useCurrentOrganizationSlug();

  const updateFilters = useCallback(
    (updates: FilterUpdatePayload) => {
      const params = new URLSearchParams(searchParams.toString());
      let shouldResetPage = false;

      if (updates.search !== undefined) {
        const nextSearch = updates.search.trim();
        setOrDeleteParam(params, QUERY_KEYS.search, nextSearch);
        shouldResetPage = true;
      }

      if (updates.status !== undefined) {
        setOrDeleteParam(params, QUERY_KEYS.status, updates.status);
        shouldResetPage = true;
      }

      if (updates.period !== undefined) {
        setOrDeleteParam(params, QUERY_KEYS.period, updates.period);

        if (updates.period !== 'custom') {
          params.delete(QUERY_KEYS.startDate);
          params.delete(QUERY_KEYS.endDate);
        }

        shouldResetPage = true;
      }

      if (updates.startDate !== undefined) {
        setOrDeleteParam(
          params,
          QUERY_KEYS.startDate,
          updates.startDate ? toISOStart(updates.startDate) : undefined
        );
      }

      if (updates.endDate !== undefined) {
        setOrDeleteParam(
          params,
          QUERY_KEYS.endDate,
          updates.endDate ? toISOEnd(updates.endDate) : undefined
        );
      }

      if (shouldResetPage) {
        params.delete(QUERY_KEYS.page);
      }

      router.push(buildEventsPath(params, getEventsIndexPath(currentOrgSlug)));
    },
    [currentOrgSlug, router, searchParams]
  );

  return {
    period: searchParams.get(QUERY_KEYS.period) ?? '',
    status: searchParams.get(QUERY_KEYS.status) ?? '',
    search: searchParams.get(QUERY_KEYS.search) ?? '',
    customStart: readDateParam(searchParams, QUERY_KEYS.startDate),
    customEnd: readDateParam(searchParams, QUERY_KEYS.endDate),
    updateFilters
  };
}

export function EventsListFilters() {
  const { period, status, search, customStart, customEnd, updateFilters } =
    useEventFilters();

  const handleSearch = useDebouncedCallback((value: string) => {
    updateFilters({ search: value });
  }, 300);

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl bg-card">
      <div className="flex-1 min-w-[200px] max-w-md">
        <Input
          key={search}
          type="search"
          leftIcon={
            <HugeiconsIcon
              icon={Search01Icon}
              size={20}
            />
          }
          placeholder="Buscar nome do evento..."
          defaultValue={search}
          onChange={(e) => handleSearch(e.target.value)}
          className={cn(filterInputClass, 'w-full')}
          aria-label="Buscar evento"
        />
      </div>
      <Select
        value={status}
        onChange={(value) => updateFilters({ status: value ?? '' })}
        options={STATUS_OPTIONS}
        placeholder="Categoria do evento"
        className="min-w-[180px]"
      />
      <Select
        value={period}
        onChange={(value) => {
          const next = value ?? '';
          updateFilters({
            period: next,
            startDate: next === 'custom' ? customStart || undefined : undefined,
            endDate: next === 'custom' ? customEnd || undefined : undefined
          });
        }}
        options={PERIOD_OPTIONS}
        placeholder="Período"
        className="min-w-[160px]"
      />
      {period === 'custom' && (
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={customStart}
            onChange={(e) =>
              updateFilters({
                period: 'custom',
                startDate: e.target.value || undefined
              })
            }
            className={cn(filterInputClass, 'w-[140px]')}
            aria-label="Data inicial"
          />
          <span className="text-sm text-muted-foreground">até</span>
          <Input
            type="date"
            value={customEnd}
            onChange={(e) =>
              updateFilters({
                period: 'custom',
                endDate: e.target.value || undefined
              })
            }
            className={cn(filterInputClass, 'w-[140px]')}
            aria-label="Data final"
          />
        </div>
      )}
    </div>
  );
}
