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

const toneClass: Record<CriterionStateMeta['tone'], string> = {
  positivo: 'border-success/40 bg-success/10 text-success',
  atencao: 'border-warning/40 bg-warning/10 text-warning',
  conflito: 'border-destructive/40 bg-destructive/10 text-destructive',
  neutro: 'border-border bg-muted text-muted-foreground',
  desativado: 'border-dashed border-border bg-transparent text-muted-foreground'
};

const toneIcon: Record<CriterionStateMeta['tone'], typeof HelpCircleIcon> = {
  positivo: CheckmarkCircle02Icon,
  atencao: HelpCircleIcon,
  conflito: AlertCircleIcon,
  neutro: MinusSignIcon,
  desativado: InformationCircleIcon
};

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

/** Legenda dos estados, exibida junto das matrizes. */
export function CriterionStateLegend({ className }: { className?: string }) {
  return (
    <ul
      className={cn('flex flex-wrap gap-x-4 gap-y-2', className)}
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
          className="flex items-start gap-2 text-xs text-muted-foreground"
        >
          <CriterionStateBadge
            state={state}
            size="sm"
          />
          <span className="max-w-60">
            {CRITERION_STATE_META[state].description}
          </span>
        </li>
      ))}
    </ul>
  );
}
