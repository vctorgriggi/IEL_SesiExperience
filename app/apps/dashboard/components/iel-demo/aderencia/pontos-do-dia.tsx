'use client';

import { ADHERENCE_THRESHOLD } from '@/features/iel-demo/analysis/adherence';
import type { AdherenceAxisEntry } from '@/features/iel-demo/analysis/adherence';
import { getFitAxis } from '@/features/iel-demo/analysis/fit-axes';
import { COPY } from '@/features/iel-demo/copy';
import { AXIS_WEIGHT_LABEL } from '@/features/iel-demo/state/selectors';

import { Badge } from '@workspace/ui/shadcn/badge';

/**
 * Os cinco pontos do dia a dia numa lista com trilho e percentual.
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
        const abaixoDoMinimo =
          temMedida && (ponto.adherence ?? 0) < ADHERENCE_THRESHOLD;

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
                    className={`text-sm font-semibold tabular-nums ${
                      abaixoDoMinimo
                        ? 'text-[hsl(var(--brand-accent))]'
                        : 'text-foreground'
                    }`}
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
              className="relative h-2 w-full overflow-hidden rounded-full bg-muted"
            >
              {temMedida ? (
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    abaixoDoMinimo
                      ? 'bg-[hsl(var(--brand-accent))]'
                      : 'bg-primary'
                  }`}
                  style={{ width: `${ponto.adherence ?? 0}%` }}
                />
              ) : null}
              <div
                className="absolute inset-y-0 w-0.5 bg-foreground/30"
                style={{ left: `${ADHERENCE_THRESHOLD}%` }}
                title={`Mínimo de ${ADHERENCE_THRESHOLD}%`}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              {temMedida ? (
                <>
                  <span>
                    Empresa: média {ponto.companyMean?.toFixed(1)} de 3
                  </span>
                  <span>
                    {primeiroNome}: opção {ponto.candidateValue} de 3
                  </span>
                </>
              ) : (
                <span>
                  {faltaDaEmpresa
                    ? 'A empresa ainda não tem respondentes suficientes para este ponto'
                    : `${primeiroNome} ainda não respondeu este ponto no questionário`}
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
