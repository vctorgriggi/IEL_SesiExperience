'use client';

import type { AdherenceAxisEntry } from '@/features/iel-demo/analysis/adherence';
import {
  CULTURE_SCALE_MAX,
  CULTURE_SCALE_MIN
} from '@/features/iel-demo/analysis/culture';
import { AXIS_SHORT_LABEL } from '@/features/iel-demo/copy';

import {
  RadarChart,
  type RadarChartPoint
} from '@workspace/charts/radar-chart';

export const COR_DA_EMPRESA = 'hsl(var(--chart-3))';
export const COR_DA_PESSOA = 'hsl(var(--chart-1))';

/**
 * Os onze temas do dia a dia em forma de polígono: a empresa e a pessoa
 * sobre a mesma escala de 1 a 3.
 *
 * O gráfico responde onde as duas formas se aproximam ou se afastam.
 * Ponto sem os dois lados entra como `null` e abre a linha do polígono.
 */
export function RadarDeAderencia({
  pontos,
  primeiroNome,
  className
}: {
  pontos: AdherenceAxisEntry[];
  primeiroNome: string;
  className?: string;
}) {
  const dados: RadarChartPoint[] = pontos.map((ponto) => ({
    axis: AXIS_SHORT_LABEL[ponto.axisId],
    empresa: ponto.companyMean,
    pessoa: ponto.candidateValue
  }));

  return (
    <figure className={`flex flex-col items-center gap-3 ${className ?? ''}`}>
      <div className="w-full max-w-[340px] aspect-square flex items-center justify-center">
        <RadarChart
          aria-hidden="true"
          size="default"
          outerRadius="62%"
          data={dados}
          domain={[CULTURE_SCALE_MIN, CULTURE_SCALE_MAX]}
          series={[
            { key: 'empresa', label: 'Empresa', color: COR_DA_EMPRESA },
            { key: 'pessoa', label: primeiroNome, color: COR_DA_PESSOA }
          ]}
        />
      </div>

      <figcaption className="flex flex-col items-center gap-1.5 text-center text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-background/80 px-2 py-0.5">
            <span
              aria-hidden="true"
              className="size-2 rounded-full"
              style={{ backgroundColor: COR_DA_EMPRESA }}
            />
            Empresa (média de respondentes)
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-background/80 px-2 py-0.5">
            <span
              aria-hidden="true"
              className="size-2 rounded-full"
              style={{ backgroundColor: COR_DA_PESSOA }}
            />
            {primeiroNome} (respostas)
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground/80">
          Escala de concordância de {CULTURE_SCALE_MIN} a {CULTURE_SCALE_MAX},
          do questionário. Não é nota.
        </p>
      </figcaption>
    </figure>
  );
}
