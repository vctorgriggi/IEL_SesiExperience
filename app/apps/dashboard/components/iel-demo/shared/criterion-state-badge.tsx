import type { ReactNode } from 'react';
import {
  CRITERION_STATE_META,
  type CriterionStateMeta
} from '@/features/iel-demo/analysis/criterion-states';
import type { CriterionState } from '@/features/iel-demo/types';
import {
  AlertCircleIcon,
  CheckmarkCircle02Icon,
  HelpCircleIcon,
  InformationCircleIcon,
  MinusSignIcon
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { cn } from '@workspace/ui';

type Tone = CriterionStateMeta['tone'];

const toneClass: Record<Tone, string> = {
  positivo: 'border-success/35 bg-success/10 text-success',
  atencao: 'border-warning/35 bg-warning/10 text-warning',
  conflito: 'border-destructive/35 bg-destructive/10 text-destructive',
  neutro: 'border-border bg-muted text-muted-foreground',
  desativado: 'border-dashed border-border bg-transparent text-muted-foreground'
};

/** Só a cor do texto: para títulos de estado, sem o peso de uma pill. */
export const criterionStateTextClass: Record<Tone, string> = {
  positivo: 'text-success',
  atencao: 'text-warning',
  conflito: 'text-destructive',
  neutro: 'text-muted-foreground',
  desativado: 'text-muted-foreground'
};

/**
 * Marcador compacto do estado. A forma muda junto da cor (preenchido, anel
 * vazado, tracejado), então continua legível sem percepção de cor.
 */
const toneDotClass: Record<Tone, string> = {
  positivo: 'bg-success',
  atencao: 'bg-warning',
  conflito: 'bg-destructive',
  neutro: 'border border-muted-foreground/50 bg-transparent',
  desativado: 'border border-dashed border-muted-foreground/40 bg-transparent'
};

const toneIcon: Record<Tone, typeof HelpCircleIcon> = {
  positivo: CheckmarkCircle02Icon,
  atencao: HelpCircleIcon,
  conflito: AlertCircleIcon,
  neutro: MinusSignIcon,
  desativado: InformationCircleIcon
};

export function getCriterionStateIcon(state: CriterionState) {
  return toneIcon[CRITERION_STATE_META[state].tone];
}

type CriterionStateBadgeProps = {
  state: CriterionState;
  /** Texto adicional após o rótulo, ex.: nome do critério. */
  suffix?: ReactNode;
  size?: 'sm' | 'md';
  className?: string;
};

/**
 * Estado de critério com ícone, marcador textual e rótulo: a leitura nunca
 * depende apenas de cor.
 */
export function CriterionStateBadge({
  state,
  suffix,
  size = 'md',
  className
}: CriterionStateBadgeProps) {
  const meta = CRITERION_STATE_META[state];

  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1.5 rounded-[var(--radius-pill)] border px-2 py-0.5 font-medium',
        size === 'sm' ? 'text-[11px]' : 'text-xs',
        toneClass[meta.tone],
        className
      )}
      title={meta.description}
    >
      <HugeiconsIcon
        icon={toneIcon[meta.tone]}
        size={size === 'sm' ? 13 : 15}
        aria-hidden="true"
      />
      <span aria-hidden="true">{meta.marker}</span>
      <span className="truncate">{meta.label}</span>
      {suffix ? <span className="truncate font-normal">{suffix}</span> : null}
    </span>
  );
}

/** Estado como título: ícone + rótulo coloridos, sem fundo. */
export function CriterionStateHeadline({
  state,
  className
}: {
  state: CriterionState;
  className?: string;
}) {
  const meta = CRITERION_STATE_META[state];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-semibold',
        criterionStateTextClass[meta.tone],
        className
      )}
      title={meta.description}
    >
      <HugeiconsIcon
        icon={toneIcon[meta.tone]}
        size={14}
        aria-hidden="true"
        className="shrink-0"
      />
      {meta.label}
    </span>
  );
}

/** Ponto de estado para listas densas de critérios. */
export function CriterionStateDot({
  state,
  className
}: {
  state: CriterionState;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'size-2 shrink-0 rounded-full',
        toneDotClass[CRITERION_STATE_META[state].tone],
        className
      )}
    />
  );
}

/** Legenda dos estados, exibida junto das matrizes. */
export function CriterionStateLegend({ className }: { className?: string }) {
  return (
    <ul
      className={cn('flex flex-wrap gap-x-4 gap-y-1.5', className)}
      aria-label="Legenda dos estados de critério"
    >
      {(
        [
          'alinhamento',
          'a-esclarecer',
          'divergencia',
          'sem-informacao',
          'nao-se-aplica'
        ] as CriterionState[]
      ).map((state) => (
        <li
          key={state}
          className="flex items-center gap-1.5"
          title={CRITERION_STATE_META[state].description}
        >
          <CriterionStateDot state={state} />
          <span className="text-[11px] text-muted-foreground">
            {CRITERION_STATE_META[state].label}
          </span>
        </li>
      ))}
    </ul>
  );
}
