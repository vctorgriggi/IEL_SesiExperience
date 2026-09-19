'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { EVENTS_PAGE_SIZE } from '@/features/events/utils/events-filters';
import { ArrowLeft01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

type EventsPaginationProps = {
  total: number;
  currentPage: number;
};

function buildPageUrl(searchParams: URLSearchParams, page: number): string {
  const params = new URLSearchParams(searchParams.toString());
  if (page <= 1) params.delete('page');
  else params.set('page', String(page));
  return `/events?${params.toString()}`;
}

export function EventsPagination({
  total,
  currentPage
}: EventsPaginationProps) {
  const searchParams = useSearchParams();
  const totalPages = Math.max(1, Math.ceil(total / EVENTS_PAGE_SIZE));
  const start = total === 0 ? 0 : (currentPage - 1) * EVENTS_PAGE_SIZE + 1;
  const end = Math.min(currentPage * EVENTS_PAGE_SIZE, total);

  if (total === 0) return null;

  const prevPage = currentPage > 1 ? currentPage - 1 : null;
  const nextPage = currentPage < totalPages ? currentPage + 1 : null;

  const pageNumbers: (number | 'ellipsis')[] = [];
  if (totalPages <= 6) {
    for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
  } else {
    pageNumbers.push(1);
    const lo = Math.max(2, currentPage - 1);
    const hi = Math.min(totalPages - 1, currentPage + 1);
    if (lo > 2) pageNumbers.push('ellipsis');
    for (let i = lo; i <= hi; i++) pageNumbers.push(i);
    if (hi < totalPages - 1) pageNumbers.push('ellipsis');
    pageNumbers.push(totalPages);
  }

  const linkClass =
    'inline-flex h-9 min-w-[36px] items-center justify-center rounded-xl border border-border bg-card text-sm font-medium text-foreground transition-colors hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50 aria-disabled:pointer-events-none aria-disabled:opacity-50';
  const activeClass =
    'border-primary/50 bg-primary/10 text-primary hover:bg-primary/15';

  return (
    <div className="flex flex-col items-center justify-between gap-4 rounded-xl border border-border bg-card px-4 py-3 sm:flex-row">
      <p className="text-sm text-muted-foreground">
        Mostrando <span className="font-medium text-foreground">{start}</span>–
        <span className="font-medium text-foreground">{end}</span> de{' '}
        <span className="font-medium text-foreground">{total}</span> eventos
      </p>
      <nav
        className="flex items-center gap-1"
        aria-label="Paginação da lista de eventos"
      >
        {prevPage ? (
          <Link
            href={buildPageUrl(searchParams, prevPage)}
            className={linkClass}
            aria-label="Página anterior"
          >
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              size={18}
            />
          </Link>
        ) : (
          <span
            className={linkClass + ' opacity-50'}
            aria-disabled
            aria-label="Página anterior"
          >
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              size={18}
            />
          </span>
        )}
        <div className="flex items-center gap-1">
          {pageNumbers.map((n, i) =>
            n === 'ellipsis' ? (
              <span
                key={`ellipsis-${i}`}
                className="inline-flex h-9 w-9 items-center justify-center text-muted-foreground"
                aria-hidden
              >
                …
              </span>
            ) : (
              <Link
                key={n}
                href={buildPageUrl(searchParams, n)}
                className={
                  linkClass + (n === currentPage ? ' ' + activeClass : '')
                }
                aria-label={`Página ${n}`}
                aria-current={n === currentPage ? 'page' : undefined}
              >
                {n}
              </Link>
            )
          )}
        </div>
        {nextPage ? (
          <Link
            href={buildPageUrl(searchParams, nextPage)}
            className={linkClass}
            aria-label="Próxima página"
          >
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              size={18}
            />
          </Link>
        ) : (
          <span
            className={linkClass + ' opacity-50'}
            aria-disabled
            aria-label="Próxima página"
          >
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              size={18}
            />
          </span>
        )}
      </nav>
    </div>
  );
}
