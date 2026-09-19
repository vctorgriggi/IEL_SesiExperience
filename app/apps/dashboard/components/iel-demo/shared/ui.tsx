import type { ReactNode } from 'react';
import type { CoverageSummary } from '@/features/iel-demo/analysis/criterion-states';

import { cn } from '@workspace/ui';

/**
 * Cobertura informacional. Mede quantos critérios têm dados suficientes — não
 * é probabilidade de sucesso nem qualidade da pessoa.
 */
export function CoverageMeter({
  coverage,
  label = 'Cobertura das informações',
  className
}: {
  coverage: CoverageSummary;
  label?: string;
  className?: string;
}) {
  const percent =
    coverage.total === 0
      ? 0
      : Math.round((coverage.withInformation / coverage.total) * 100);

  return (
    <div className={cn('space-y-1', className)}>
      <p className="text-xs font-medium text-foreground">
        {coverage.withInformation} de {coverage.total} critérios com dados
        suficientes
      </p>
      <div
        role="meter"
        aria-label={label}
        aria-valuenow={coverage.withInformation}
        aria-valuemin={0}
        aria-valuemax={coverage.total}
        aria-valuetext={`${coverage.withInformation} de ${coverage.total} critérios com dados suficientes`}
        className="h-1.5 w-full overflow-hidden rounded-[var(--radius-pill)] bg-muted"
      >
        <div
          className="h-full rounded-[var(--radius-pill)] bg-info"
          style={{ width: `${percent}%` }}
        />
      </div>
      {coverage.missing.length > 0 ? (
        <p className="text-[11px] text-muted-foreground">
          Sem informação: {coverage.missing.join(', ')}
        </p>
      ) : null}
    </div>
  );
}

/** Cabeçalho de tela com contexto persistente de empresa e vaga. */
export function IelPageHeader({
  eyebrow,
  title,
  description,
  actions,
  children
}: {
  eyebrow?: ReactNode;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="space-y-3 border-b border-border pb-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-1">
          {eyebrow ? (
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          {description ? (
            <p className="max-w-3xl text-sm text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        ) : null}
      </div>
      {children}
    </header>
  );
}

/** Rótulo discreto e persistente do ambiente de demonstração. */
export function DemoDataBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border border-dashed border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground',
        className
      )}
    >
      <span
        aria-hidden="true"
        className="size-1.5 rounded-full bg-warning"
      />
      Dados fictícios — demonstração
    </span>
  );
}

/** Origem de um dado: fonte, data e natureza. */
export function SourceTag({
  source,
  updatedAt,
  nature,
  className
}: {
  source: string;
  updatedAt?: string;
  nature?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex flex-wrap items-center gap-x-1.5 text-[11px] text-muted-foreground',
        className
      )}
    >
      <span className="font-medium text-foreground/80">{source}</span>
      {nature ? <span>· {nature}</span> : null}
      {updatedAt ? <span>· atualizado em {formatDate(updatedAt)}</span> : null}
    </span>
  );
}

export function formatDate(value: string): string {
  const date = new Date(value.length === 10 ? `${value}T12:00:00.000Z` : value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC'
  });
}

export function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/** Pequena etiqueta neutra para estados operacionais. */
export function Chip({
  children,
  tone = 'neutro',
  className
}: {
  children: ReactNode;
  tone?: 'neutro' | 'info' | 'positivo' | 'atencao' | 'conflito';
  className?: string;
}) {
  const toneClass = {
    neutro: 'border-border bg-muted text-muted-foreground',
    info: 'border-info/40 bg-info/10 text-info',
    positivo: 'border-success/40 bg-success/10 text-success',
    atencao: 'border-warning/40 bg-warning/10 text-warning',
    conflito: 'border-destructive/40 bg-destructive/10 text-destructive'
  }[tone];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-[var(--radius-pill)] border px-2 py-0.5 text-[11px] font-medium',
        toneClass,
        className
      )}
    >
      {children}
    </span>
  );
}

/** Lista de barras horizontais para perguntas agregadas simples. */
export function BarList({
  items,
  emptyMessage = 'Sem registros para o filtro atual.'
}: {
  items: { id: string; label: string; count: number; onSelect?: () => void }[];
  emptyMessage?: string;
}) {
  const max = Math.max(...items.map((item) => item.count), 1);
  const total = items.reduce((sum, item) => sum + item.count, 0);

  if (total === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            onClick={item.onSelect}
            disabled={!item.onSelect || item.count === 0}
            className="group flex w-full items-center gap-3 rounded-[var(--control-radius)] px-1 py-1 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-default disabled:hover:bg-transparent"
          >
            <span className="w-36 shrink-0 truncate text-xs text-foreground">
              {item.label}
            </span>
            <span className="h-2 flex-1 overflow-hidden rounded-[var(--radius-pill)] bg-muted">
              <span
                className="block h-full rounded-[var(--radius-pill)] bg-chart-1"
                style={{ width: `${(item.count / max) * 100}%` }}
              />
            </span>
            <span className="w-16 shrink-0 text-right text-xs font-medium text-foreground">
              {item.count}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
