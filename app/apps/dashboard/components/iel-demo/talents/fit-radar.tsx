'use client';

import {
  AXIS_WEIGHT_LABEL,
  type FitReadingEntry
} from '@/features/iel-demo/state/selectors';
import type { AxisWeight, CriterionState } from '@/features/iel-demo/types';

import { RadarChart } from '@workspace/charts/radar-chart';

/**
 * A escada de estados, em números.
 *
 * O radar precisa de um valor por eixo, e o estado de um eixo é uma palavra.
 * A conversão é ordinal e declarada: quanto mais alto, mais a leitura se
 * sustenta. Não é escore — 3 não vale o triplo de 1, e dois eixos em 3 não
 * somam 6. A legenda abaixo do gráfico diz isso com todas as letras, porque
 * um polígono grande é lido como "boa nota" por quem não leu o resto da tela.
 */
const STATE_STEP: Record<CriterionState, number> = {
  'sem-informacao': 0,
  divergencia: 1,
  'a-esclarecer': 2,
  alinhamento: 3,
  // Fora do escopo do eixo: não desenha degrau nenhum.
  'nao-se-aplica': 0
};

const WEIGHT_STEP: Record<AxisWeight, number> = {
  baixo: 1,
  medio: 2,
  alto: 3
};

/**
 * Radar da aderência, eixo a eixo, contra a prioridade da vaga.
 *
 * As duas séries respondem a perguntas diferentes e por isso ficam juntas: a
 * primeira é o quanto a leitura se sustenta em cada eixo, a segunda é o
 * quanto a empresa disse que aquele eixo decide esta vaga. Onde a prioridade
 * avança e a leitura não acompanha, há trabalho a fazer — uma pergunta
 * dirigida, uma condição a confirmar. É a única comparação que o gráfico
 * propõe; nenhuma área, nenhum total, nenhuma nota.
 */
export function FitRadar({ reading }: { reading: FitReadingEntry[] }) {
  const data = reading.map((entry) => ({
    axis: entry.axis.label,
    leitura: STATE_STEP[entry.state],
    prioridade: WEIGHT_STEP[entry.weight]
  }));

  return (
    <figure className="m-0">
      {/* A altura vem daqui, e não do tamanho padrão do componente: o
          Tailwind desta app não varre `packages/charts`, então uma classe
          declarada lá dentro não chega a existir no CSS gerado. */}
      <RadarChart
        className="h-[320px] w-full"
        data={data}
        domain={[0, 3]}
        series={[
          {
            key: 'leitura',
            label: 'Leitura desta pessoa nesta vaga',
            color: 'hsl(var(--chart-1))',
            fillOpacity: 0.14
          },
          {
            key: 'prioridade',
            label: 'Prioridade declarada pela vaga',
            color: 'hsl(var(--chart-2))',
            fillOpacity: 0.08,
            strokeDasharray: '4 3'
          }
        ]}
      />

      <figcaption className="mt-2 space-y-1.5">
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <li className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span
              aria-hidden="true"
              className="size-2 shrink-0 rounded-full bg-chart-1"
            />
            Leitura desta pessoa nesta vaga
          </li>
          <li className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span
              aria-hidden="true"
              className="size-2 shrink-0 rounded-full bg-chart-2"
            />
            Prioridade declarada pela vaga
          </li>
        </ul>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          A escala é a escada dos estados, não uma nota: sem informação,
          divergência, a esclarecer, alinhamento. Os valores não se somam e não
          produzem percentual.
        </p>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Prioridade: {AXIS_WEIGHT_LABEL.baixo}, {AXIS_WEIGHT_LABEL.medio} e{' '}
          {AXIS_WEIGHT_LABEL.alto} ocupam, na mesma ordem, os três degraus da
          escala.
        </p>
      </figcaption>
    </figure>
  );
}
