'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const PERIODS = ['1d', '7d', '15d', '30d'] as const;

const PERIOD_LABELS: Record<(typeof PERIODS)[number], string> = {
  '1d': 'Hoje',
  '7d': '7d',
  '15d': '15d',
  '30d': '30d'
};

export type HomePeriodFilterProps = {
  currentPeriod: string;
};

export function HomePeriodFilter({ currentPeriod }: HomePeriodFilterProps) {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground">
        Filtrar por período
      </span>
      <div className="flex gap-1">
        {PERIODS.map((period) => (
          <Link
            key={period}
            href={`${pathname}?period=${period}`}
            className={
              period === currentPeriod
                ? 'h-8 rounded-lg px-3 inline-flex items-center justify-center text-sm font-medium bg-primary text-primary-foreground'
                : 'h-8 px-3 rounded-lg border border-border/50 bg-muted/30 text-muted-foreground hover:border-border hover:bg-muted/50 hover:text-foreground text-sm font-medium inline-flex items-center justify-center transition-colors'
            }
          >
            {PERIOD_LABELS[period]}
          </Link>
        ))}
      </div>
    </div>
  );
}
