'use client';

import { ADHERENCE_THRESHOLD } from '@/features/iel-demo/analysis/adherence';
import type { AdherenceAxisEntry } from '@/features/iel-demo/analysis/adherence';
import { getFitAxis } from '@/features/iel-demo/analysis/fit-axes';
import { rotuloDaEscala } from '@/features/iel-demo/analysis/instrumento';
import { COPY } from '@/features/iel-demo/copy';
import { AXIS_WEIGHT_LABEL } from '@/features/iel-demo/state/selectors';

import { cn } from '@workspace/ui/lib/utils';
import { Badge } from '@workspace/ui/shadcn/badge';

import { barraDaAderencia, textoDaAderencia, TRILHO } from '../metricas/cores';

/**
 * Os dez temas do dia a dia numa lista com trilho e percentual.
 *
 * Cada ponto mostra o alinhamento da pessoa com a empresa naquele aspecto,
 * o peso declarado pela empresa e as respostas dadas por cada lado (LGPD art. 20, § 1º).
 * Ponto sem resposta de um dos lados não vira zero — informa claramente a pendência.
 */
export function PontosDoDia({
  pontos,
  primeiroNome
}: {
  pontos: AdherenceAxisEntry[];
  primeiroNome: string;
}) {
  return (
    <ol
      aria-label={`${COPY.axes.label}: combina com ${primeiroNome} em cada ponto`}
      className="flex flex-col gap-2.5"
    >
      {pontos.map((ponto) => {
        const faltaDaEmpresa = ponto.companyMean === null;
        const temMedida = ponto.adherence !== null;

        return (
          <li
            key={ponto.axisId}
            className="flex flex-col gap-2 rounded-lg border border-border/70 bg-card p-3 shadow-2xs transition-colors hover:border-border"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  {getFitAxis(ponto.axisId).label}
                  <span className="sr-only">:</span>
                </span>
                <Badge
                  variant="secondary"
                  className="text-[11px] font-normal px-2 py-0 h-5"
                >
                  {AXIS_WEIGHT_LABEL[ponto.weight]}
                </Badge>
              </div>

              <div className="flex items-center gap-1.5">
                {temMedida ? (
                  <span
                    className={cn(
                      'text-sm font-semibold tabular-nums',
                      textoDaAderencia(ponto.adherence)
                    )}
                  >
                    {Math.round(ponto.adherence ?? 0)}%
                  </span>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-xs font-normal text-muted-foreground"
                  >
                    {faltaDaEmpresa
                      ? 'faltam respostas da empresa'
                      : COPY.fit.semResposta}
                  </Badge>
                )}
              </div>
            </div>

            <div
              aria-hidden="true"
              className={cn(
                'relative h-2 w-full overflow-hidden rounded-full',
                TRILHO.trilha
              )}
            >
              {temMedida ? (
                <div
                  className={cn(
                    'h-full rounded-full',
                    barraDaAderencia(ponto.adherence)
                  )}
                  style={{ width: `${ponto.adherence ?? 0}%` }}
                />
              ) : null}
              <div
                className={cn('absolute inset-y-0 w-0.5', TRILHO.minimo)}
                style={{ left: `${ADHERENCE_THRESHOLD}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              {temMedida ? (
                <>
                  <span>
                    Empresa: {rotuloDaEscala(ponto.companyMean ?? 0)} (média{' '}
                    {ponto.companyMean?.toFixed(1)})
                  </span>
                  <span>
                    {primeiroNome}: {rotuloDaEscala(ponto.candidateValue ?? 0)}
                  </span>
                </>
              ) : (
                <span>
                  {faltaDaEmpresa
                    ? 'A empresa ainda não tem respondentes suficientes para este tema'
                    : `${primeiroNome} ainda não respondeu este tema no questionário`}
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
