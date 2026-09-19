/**
 * Slider de eixo com polos nomeados.
 *
 * Um eixo de aderência tem dois lados e uma distância entre eles. Enquanto
 * isso era um parágrafo de cada lado de uma régua, a distância existia no
 * texto e não na forma — e é a distância que o analista precisa ver.
 *
 * O que ele NÃO faz:
 *
 * - **Não soma eixos.** Desenha um eixo por vez. A composição dos eixos num
 *   percentual é trabalho do motor de aderência, não deste componente.
 * - **Não chama a posição de nota.** A escala é ordinal (1..3) e os polos
 *   são descrições de prática de trabalho. Estar em 1 não é pior que estar
 *   em 3: é outra condição, e a pessoa que combina com ela é outra.
 * - **Não esconde `null`.** Faltando um lado, o marcador daquele lado não
 *   entra no trilho: sai para a linha do rótulo, tracejado e com o texto
 *   dizendo qual lado não informou. Ausência nunca vira posição, e nunca é
 *   desenhada no degrau mínimo.
 * - **Não guarda estado.** É presentacional: só props, nenhum seletor.
 */

import type { CriterionState } from '@/features/iel-demo/types';

import { cn } from '@workspace/ui';

/** Cor da régua, herdada do estado do encontro entre os dois lados. */
const TRACK_STATE_CLASS: Record<CriterionState, string> = {
  alinhamento: 'bg-success/25',
  'a-esclarecer': 'bg-warning/25',
  divergencia: 'bg-destructive/25',
  'sem-informacao': 'bg-muted',
  'nao-se-aplica': 'bg-muted'
};

const WEIGHT_LABEL = {
  alto: 'peso alto',
  medio: 'peso médio',
  baixo: 'peso baixo'
} as const;

export type FitAxisSliderProps = {
  label: string;
  /** Extremos nomeados: [polo do valor mínimo, polo do valor máximo]. */
  poles: [string, string];
  /** Posição da empresa na escala ordinal, ou `null` se ela não informou. */
  companyValue: number | null;
  /** Posição da pessoa na escala ordinal, ou `null` se ela não declarou. */
  candidateValue: number | null;
  min: 1;
  max: 3;
  weight?: 'alto' | 'medio' | 'baixo';
  state?: CriterionState;
  className?: string;
};

/** Converte a posição ordinal em percentual do trilho. */
function toPercent(value: number, min: number, max: number): number {
  if (max === min) return 50;
  return ((Math.max(min, Math.min(max, value)) - min) / (max - min)) * 100;
}

export function FitAxisSlider({
  label,
  poles,
  companyValue,
  candidateValue,
  min,
  max,
  weight,
  state = 'sem-informacao',
  className
}: FitAxisSliderProps) {
  const companyPercent =
    companyValue === null ? null : toPercent(companyValue, min, max);
  const candidatePercent =
    candidateValue === null ? null : toPercent(candidateValue, min, max);

  const bothInformed = companyPercent !== null && candidatePercent !== null;
  const coincide = bothInformed && companyPercent === candidatePercent;

  const describe = (value: number | null) =>
    value === null
      ? 'não informado'
      : value === min
        ? poles[0]
        : value === max
          ? poles[1]
          : 'posição intermediária';

  const description = `${label}. A equipe: ${describe(companyValue)}. A pessoa: ${describe(
    candidateValue
  )}. Escala de ${poles[0]} a ${poles[1]}.`;

  return (
    <div className={cn('py-4', className)}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {/* Marcador de ausência, deliberadamente fora do trilho. */}
        {!bothInformed ? (
          <span className="ml-auto flex shrink-0 items-center gap-1.5 rounded-[var(--control-radius)] border border-dashed border-border px-2 py-0.5 text-[11px] text-muted-foreground">
            <span
              aria-hidden="true"
              className={cn(
                'size-2.5 border border-dashed border-border-strong',
                companyPercent === null ? 'rounded-[3px]' : 'rounded-full'
              )}
            />
            {companyPercent === null && candidatePercent === null
              ? 'nenhum lado informado'
              : companyPercent === null
                ? 'a equipe não informou'
                : 'a pessoa não informou'}
          </span>
        ) : null}
        {weight ? (
          <span
            className={cn(
              'shrink-0 rounded-[var(--radius-pill)] border border-border px-2 py-px text-[11px] font-medium text-muted-foreground',
              bothInformed && 'ml-auto'
            )}
          >
            {WEIGHT_LABEL[weight]}
          </span>
        ) : null}
      </div>

      <div
        role="img"
        aria-label={description}
        className="mt-3 flex items-center gap-2.5"
      >
        {/* Polo do mínimo, fora do trilho: o trilho fica limpo para os marcadores. */}
        <p className="hidden w-[8.5rem] shrink-0 text-right text-[11px] leading-snug text-muted-foreground sm:block">
          {poles[0]}
        </p>

        {/*
          A banda interna existe para que um marcador em 0% ou em 100% caiba
          dentro do trilho: `left` em porcentagem resolve contra a caixa de
          preenchimento, então recuar o trilho exige um contexto próprio.
        */}
        <div className="relative h-9 min-w-0 flex-1">
          <div className="absolute inset-y-0 left-2.5 right-2.5">
            <span
              aria-hidden="true"
              className={cn(
                'absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-[var(--radius-pill)]',
                TRACK_STATE_CLASS[state]
              )}
            />
            {/* Degraus da escala ordinal: sem eles o trilho vira contínuo, e a
              escala não é. */}
            {Array.from({ length: max - min + 1 }, (_, index) => (
              <span
                key={index}
                aria-hidden="true"
                className="absolute top-1/2 size-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground/20"
                style={{ left: `${toPercent(min + index, min, max)}%` }}
              />
            ))}

            {/* Corda entre os dois lados: a distância, desenhada. */}
            {bothInformed && !coincide ? (
              <span
                aria-hidden="true"
                className="absolute top-1/2 h-0.5 -translate-y-1/2 bg-foreground/25"
                style={{
                  left: `${Math.min(companyPercent, candidatePercent)}%`,
                  width: `${Math.abs(companyPercent - candidatePercent)}%`
                }}
              />
            ) : null}

            {companyPercent !== null ? (
              <span
                aria-hidden="true"
                title="A equipe"
                className={cn(
                  'absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-[3px] bg-chart-2 ring-2 ring-card',
                  coincide && 'ring-4'
                )}
                style={{ left: `${companyPercent}%` }}
              />
            ) : null}

            {candidatePercent !== null ? (
              <span
                aria-hidden="true"
                title="A pessoa"
                className={cn(
                  'absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-chart-1 ring-2 ring-card',
                  coincide && 'ring-0'
                )}
                style={{ left: `${candidatePercent}%` }}
              />
            ) : null}
          </div>
        </div>

        <p className="hidden w-[8.5rem] shrink-0 text-[11px] leading-snug text-muted-foreground sm:block">
          {poles[1]}
        </p>
      </div>

      {/* Na largura de celular os polos não cabem nas pontas: descem para cá. */}
      <p className="mt-2 flex justify-between gap-3 text-[11px] leading-snug text-muted-foreground sm:hidden">
        <span className="min-w-0">{poles[0]}</span>
        <span className="min-w-0 text-right">{poles[1]}</span>
      </p>
    </div>
  );
}
