import type { ReactNode } from 'react';
import type { CoverageSummary } from '@/features/iel-demo/analysis/criterion-states';
import { InformationCircleIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { cn } from '@workspace/ui';

/**
 * Definição de um termo, disponível sem ocupar uma linha de texto.
 *
 * O domínio tem distinções que precisam estar ao alcance (cobertura não é
 * afinidade, etapa de origem não é etapa do IEL), mas escrever cada uma
 * delas como parágrafo abaixo do título transforma a tela num manual.
 */
export function InfoHint({
  label,
  className
}: {
  label: string;
  className?: string;
}) {
  return (
    <span
      role="note"
      tabIndex={0}
      title={label}
      aria-label={label}
      className={cn(
        'inline-flex cursor-help align-middle text-muted-foreground/70 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:text-foreground',
        className
      )}
    >
      <HugeiconsIcon
        icon={InformationCircleIcon}
        size={14}
        aria-hidden="true"
      />
    </span>
  );
}

/** Título de bloco: uma linha, com a definição atrás de um ícone. */
export function SectionTitle({
  children,
  hint,
  className
}: {
  children: ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <h2
      className={cn(
        'flex items-center gap-1.5 text-sm font-semibold text-foreground',
        className
      )}
    >
      {children}
      {hint ? <InfoHint label={hint} /> : null}
    </h2>
  );
}

/** Indicador numérico compacto. */
export function StatCard({
  label,
  value,
  hint,
  icon,
  href
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon?: ReactNode;
  href?: ReactNode;
}) {
  return (
    <div className="rounded-[var(--card-radius)] border border-border bg-card px-4 py-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs font-medium">{label}</span>
        {hint ? <InfoHint label={hint} /> : null}
      </div>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
        {value}
      </p>
      {href}
    </div>
  );
}

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

const SOURCE_DOT_CLASS: Record<string, string> = {
  'FONTE-EMPREGARE': 'bg-chart-1',
  'FONTE-IEL': 'bg-chart-3',
  'FONTE-EMPRESA': 'bg-chart-2',
  'FONTE-AVALIACAO': 'bg-chart-5'
};

/**
 * Procedência de um conjunto de registros.
 *
 * É a afirmação central do produto: esta leitura reúne informações que hoje
 * vivem em sistemas separados. Sem isso na tela, a integração fica só no
 * modelo de dados e o analista vê um painel qualquer.
 */
export function SourceBreakdownBar({
  breakdown,
  total,
  className
}: {
  breakdown: { sourceId: string; shortName: string; count: number }[];
  total: number;
  className?: string;
}) {
  if (breakdown.length === 0) return null;

  return (
    <div
      className={cn('flex flex-wrap items-center gap-x-4 gap-y-1', className)}
    >
      <p className="text-xs text-muted-foreground">
        Esta análise reúne{' '}
        <span className="font-semibold text-foreground">
          {total} {total === 1 ? 'registro' : 'registros'}
        </span>{' '}
        de{' '}
        <span className="font-semibold text-foreground">
          {breakdown.length} {breakdown.length === 1 ? 'fonte' : 'fontes'}
        </span>
        <InfoHint
          className="ml-1"
          label="Em produção, cada fonte é um sistema ou etapa diferente: consultá-las separadamente e juntar o resultado é o trabalho manual que a central substitui."
        />
      </p>
      <ul className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {breakdown.map((entry) => (
          <li
            key={entry.sourceId}
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <span
              aria-hidden="true"
              className={cn(
                'size-2 shrink-0 rounded-full',
                SOURCE_DOT_CLASS[entry.sourceId] ?? 'bg-muted-foreground'
              )}
            />
            {entry.shortName}
            <span className="font-medium tabular-nums text-foreground">
              {entry.count}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Ponto colorido da fonte, para uso inline junto de um registro. */
export function SourceDot({
  sourceId,
  className
}: {
  sourceId: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-block size-2 shrink-0 rounded-full',
        SOURCE_DOT_CLASS[sourceId] ?? 'bg-muted-foreground',
        className
      )}
    />
  );
}
