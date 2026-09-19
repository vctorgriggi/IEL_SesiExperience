/**
 * Uma linha de ranking: posição, pessoa, técnico e fit lado a lado.
 *
 * Os dois números ficam juntos e separados de propósito. Técnico e aderência
 * respondem a perguntas diferentes e não se combinam; quem decide é quem lê,
 * e para decidir precisa dos dois no mesmo relance.
 *
 * O que ela NÃO faz:
 *
 * - **Não soma os dois números.** Não existe "nota final" aqui. Somar
 *   técnico com aderência inventaria a ponderação que ninguém declarou.
 * - **Não chama nenhum dos números de "chance".** São compatibilidade
 *   técnica e aderência ao contexto de trabalho, medidas de informação
 *   disponível — não probabilidade de contratação nem qualidade da pessoa.
 * - **Não esconde `null`.** Faltando um dos lados, a barra some e o número
 *   vira "—" com "sem dados". Nunca 0.
 * - **Não elimina ninguém.** `belowThreshold` marca a linha abaixo do corte
 *   e a mantém legível e operável: o corte é triagem, e a decisão de
 *   descartar continua sendo de uma pessoa.
 * - **Não ordena nada.** Recebe `rank` pronto.
 */

import type { ReactNode } from 'react';

import { cn } from '@workspace/ui';

/** Um dos dois números da linha, com a barra fina que o dimensiona. */
function RankMetric({
  label,
  value,
  tone
}: {
  label: string;
  value: number | null;
  tone: 'tecnico' | 'fit';
}) {
  const hasValue = value !== null;
  const clamped = hasValue ? Math.max(0, Math.min(100, value)) : 0;

  return (
    <div className="w-[5.5rem] shrink-0">
      <p className="iel-eyebrow text-[10px]">{label}</p>
      <p
        className={cn(
          'iel-figure mt-0.5 text-[1.375rem] leading-none',
          hasValue ? 'text-foreground' : 'text-muted-foreground'
        )}
      >
        {hasValue ? (
          <>
            {clamped}
            <span className="text-[0.55em] align-super">%</span>
          </>
        ) : (
          '—'
        )}
      </p>
      {hasValue ? (
        <span
          aria-hidden="true"
          className="mt-1.5 block h-1 w-full overflow-hidden rounded-[var(--radius-pill)] bg-muted"
        >
          <span
            className={cn(
              'block h-full rounded-[var(--radius-pill)]',
              tone === 'fit' ? 'bg-chart-2' : 'bg-chart-1'
            )}
            style={{ width: `${clamped}%` }}
          />
        </span>
      ) : (
        <span className="mt-1 block text-[10px] leading-none text-muted-foreground">
          sem dados
        </span>
      )}
    </div>
  );
}

export type RankRowProps = {
  rank: number;
  name: string;
  /** Uma linha de contexto da pessoa, como ela se descreve. */
  headline?: string;
  /** Compatibilidade técnica em pontos percentuais, ou `null` sem dados. */
  technicalMatch: number | null;
  /** Aderência ao contexto de trabalho, ou `null` sem dados. */
  adherence: number | null;
  /** Corte de triagem da vaga, em pontos percentuais. */
  threshold: number;
  /** Se esta candidatura está abaixo do corte. Marca, não remove. */
  belowThreshold: boolean;
  selected?: boolean;
  onSelect?: () => void;
  actions?: ReactNode;
  className?: string;
};

export function RankRow({
  rank,
  name,
  headline,
  technicalMatch,
  adherence,
  threshold,
  belowThreshold,
  selected,
  onSelect,
  actions,
  className
}: RankRowProps) {
  const Row = onSelect ? 'button' : 'div';

  return (
    <div
      className={cn(
        'iel-interactive flex items-center gap-3 border-b border-border px-3 py-2.5 last:border-0',
        selected && 'bg-accent/60',
        belowThreshold && 'opacity-75',
        className
      )}
    >
      <Row
        {...(onSelect
          ? {
              type: 'button' as const,
              onClick: onSelect,
              'aria-pressed': selected ?? false
            }
          : {})}
        className={cn(
          'flex min-w-0 flex-1 items-center gap-3 text-left',
          onSelect &&
            'rounded-[var(--control-radius)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40'
        )}
      >
        <span
          className={cn(
            'iel-figure w-7 shrink-0 text-right text-sm',
            belowThreshold ? 'text-muted-foreground' : 'text-foreground'
          )}
        >
          {rank}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-foreground">
            {name}
          </span>
          {headline ? (
            <span className="block truncate text-xs text-muted-foreground">
              {headline}
            </span>
          ) : null}
        </span>
      </Row>

      <RankMetric
        label="Técnico"
        value={technicalMatch}
        tone="tecnico"
      />
      <RankMetric
        label="Fit"
        value={adherence}
        tone="fit"
      />

      <span
        className={cn(
          'w-[6.5rem] shrink-0 text-[11px] leading-snug',
          belowThreshold ? 'text-warning' : 'text-muted-foreground'
        )}
      >
        {belowThreshold
          ? `abaixo do corte (${threshold}%)`
          : `corte ${threshold}%`}
      </span>

      {actions ? (
        <span className="flex shrink-0 items-center gap-1.5">{actions}</span>
      ) : null}
    </div>
  );
}
