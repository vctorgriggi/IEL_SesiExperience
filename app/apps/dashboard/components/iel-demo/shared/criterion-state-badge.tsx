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
