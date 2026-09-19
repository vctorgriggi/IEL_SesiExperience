/**
 * Anel de aderência.
 *
 * O que ele NÃO faz, e não pode passar a fazer sem que alguém reabra esta
 * discussão:
 *
 * - **Não calcula nada.** Recebe `value` pronto do motor de aderência. Não
 *   soma eixos, não pondera peso, não infere valor a partir de estado.
 * - **Não chama o número de "chance".** Aderência é distância entre duas
 *   descrições de condição de trabalho, não probabilidade de sucesso nem
 *   qualidade da pessoa. O rótulo diz "aderência", e o corte é um corte de
 *   triagem, não uma aprovação.
 * - **Não esconde `null`.** Faltando um dos lados, o anel fica vazio e diz
 *   "sem dados". Desenhar 0% quando falta informação transformaria ausência
 *   em resultado desfavorável, que é o erro que esta demonstração existe
 *   para não cometer.
 * - **Não anima ao carregar.** A transição só responde a hover e foco de
 *   quem usa.
 */

import { cn } from '@workspace/ui';

/** Geometria por tamanho: diâmetro, espessura do anel e corpo do número. */
const SIZE_SPEC = {
  md: { box: 128, stroke: 10, figure: 'text-[1.75rem]' },
  lg: { box: 184, stroke: 14, figure: 'text-[3.25rem]' }
} as const;

export type AdherenceRingProps = {
  /** Percentual de aderência já calculado. `null` quando falta um dos lados. */
  value: number | null;
  /** Corte de triagem da vaga, em pontos percentuais. */
  threshold: number;
  size?: 'md' | 'lg';
  /** Rótulo sob o número. O padrão nomeia a medida, nunca a pessoa. */
  label?: string;
  className?: string;
};

export function AdherenceRing({
  value,
  threshold,
  size = 'md',
  label = 'de aderência',
  className
}: AdherenceRingProps) {
  const spec = SIZE_SPEC[size];
  const center = spec.box / 2;
  const radius = center - spec.stroke / 2 - 1;
  const circumference = 2 * Math.PI * radius;

  const hasValue = value !== null;
  const clamped = hasValue ? Math.max(0, Math.min(100, value)) : 0;
  const meetsThreshold = hasValue && clamped >= threshold;

  const arcClass = !hasValue
    ? 'text-border-strong'
    : meetsThreshold
      ? 'text-success'
      : 'text-warning';

  // O tique do corte fica no mesmo referencial do arco: 12 horas é 0%, o
  // sentido é horário. Sem ele o percentual não tem contra o que ser lido.
  const tickAngle = (threshold / 100) * 2 * Math.PI - Math.PI / 2;

  const description = hasValue
    ? `${clamped}% de aderência; corte da vaga em ${threshold}%. ${
        meetsThreshold ? 'Acima do corte.' : 'Abaixo do corte.'
      }`
    : `Aderência sem dados: falta um dos lados. Corte da vaga em ${threshold}%.`;

  return (
    <figure
      role="img"
      aria-label={description}
      className={cn('m-0 flex flex-col items-center gap-2', className)}
    >
      <div
        className="relative"
        style={{ width: spec.box, height: spec.box }}
      >
        <svg
          viewBox={`0 0 ${spec.box} ${spec.box}`}
          width={spec.box}
          height={spec.box}
          aria-hidden="true"
          className="-rotate-90"
        >
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            strokeWidth={spec.stroke}
            className="text-muted"
            stroke="currentColor"
          />
          {hasValue ? (
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              strokeWidth={spec.stroke}
              strokeLinecap="round"
              stroke="currentColor"
              strokeDasharray={`${(clamped / 100) * circumference} ${circumference}`}
              className={arcClass}
            />
          ) : (
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              strokeWidth={spec.stroke}
              strokeDasharray="2 8"
              strokeLinecap="round"
              stroke="currentColor"
              className="text-border-strong"
            />
          )}
        </svg>

        {/* Marca do corte, por cima do arco e fora da rotação do grupo. */}
        <svg
          viewBox={`0 0 ${spec.box} ${spec.box}`}
          width={spec.box}
          height={spec.box}
          aria-hidden="true"
          className="absolute inset-0"
        >
          <line
            x1={center + Math.cos(tickAngle) * (radius - spec.stroke / 2 - 1)}
            y1={center + Math.sin(tickAngle) * (radius - spec.stroke / 2 - 1)}
            x2={center + Math.cos(tickAngle) * (radius + spec.stroke / 2 + 1)}
            y2={center + Math.sin(tickAngle) * (radius + spec.stroke / 2 + 1)}
            strokeWidth={2}
            strokeLinecap="round"
            stroke="currentColor"
            className="text-foreground/55"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {hasValue ? (
            <span
              className={cn(
                'iel-figure leading-none text-foreground',
                spec.figure
              )}
            >
              {clamped}
              <span className="text-[0.45em] align-super">%</span>
            </span>
          ) : (
            <span className="max-w-[70%] text-xs font-medium leading-snug text-muted-foreground">
              sem dados
            </span>
          )}
          {hasValue ? (
            <span className="mt-1 text-[11px] leading-none text-muted-foreground">
              {label}
            </span>
          ) : null}
        </div>
      </div>

      <figcaption className="text-[11px] leading-relaxed text-muted-foreground">
        Corte desta vaga: <span className="tabular-nums">{threshold}%</span>
        {hasValue ? (
          <>
            {' · '}
            <span className={meetsThreshold ? 'text-success' : 'text-warning'}>
              {meetsThreshold ? 'acima do corte' : 'abaixo do corte'}
            </span>
          </>
        ) : (
          ' · falta um dos lados'
        )}
      </figcaption>
    </figure>
  );
}
