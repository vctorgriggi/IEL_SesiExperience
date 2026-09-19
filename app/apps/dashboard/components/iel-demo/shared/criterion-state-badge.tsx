import {
  CRITERION_STATE_META,
  type CriterionStateMeta
} from '@/features/iel-demo/analysis/criterion-states';
import type { CriterionState } from '@/features/iel-demo/types';
import {
  CircleAlert,
  CircleCheck,
  CircleHelp,
  Info,
  Minus
} from 'lucide-react';

import { cn } from '@workspace/ui';

import {
  BADGE_DE_ESTADO,
  PREENCHIMENTO_DE_ESTADO,
  TEXTO_DE_ESTADO,
  type EstadoDeCor
} from '../metricas/cores';

type Tone = CriterionStateMeta['tone'];

/** Tom do critério → estado de cor: combina, atenção, difere ou sem dado. */
const TOM: Record<Tone, EstadoDeCor> = {
  positivo: 'combina',
  atencao: 'atencao',
  conflito: 'difere',
  neutro: 'neutro',
  desativado: 'neutro'
};

/** Só a cor do texto: para títulos de estado, sem o peso de uma pill. */
export const criterionStateTextClass: Record<Tone, string> = {
  positivo: TEXTO_DE_ESTADO.combina,
  atencao: TEXTO_DE_ESTADO.atencao,
  conflito: TEXTO_DE_ESTADO.difere,
  neutro: TEXTO_DE_ESTADO.neutro,
  desativado: TEXTO_DE_ESTADO.neutro
};

/**
 * Marcador compacto do estado. A forma muda junto da cor (preenchido, anel
 * vazado, tracejado), então continua legível sem percepção de cor.
 */
const toneDotClass: Record<Tone, string> = {
  positivo: PREENCHIMENTO_DE_ESTADO.combina,
  atencao: PREENCHIMENTO_DE_ESTADO.atencao,
  conflito: PREENCHIMENTO_DE_ESTADO.difere,
  neutro: 'border border-muted-foreground/50 bg-transparent',
  desativado: 'border border-dashed border-muted-foreground/40 bg-transparent'
};

const toneIcon: Record<Tone, typeof CircleHelp> = {
  positivo: CircleCheck,
  atencao: CircleHelp,
  conflito: CircleAlert,
  neutro: Minus,
  desativado: Info
};

/** Estado como selo: fundo tingido, ícone e rótulo no mesmo tom. */
export function CriterionStateHeadline({
  state,
  className
}: {
  state: CriterionState;
  className?: string;
}) {
  const meta = CRITERION_STATE_META[state];
  const Icon = toneIcon[meta.tone];

  return (
    <span
      className={cn(
        'inline-flex w-fit items-center gap-1.5 rounded-md border px-1.5 py-0.5 text-xs font-semibold',
        BADGE_DE_ESTADO[TOM[meta.tone]],
        className
      )}
      title={meta.description}
    >
      <Icon
        aria-hidden="true"
        className="size-3.5 shrink-0"
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
