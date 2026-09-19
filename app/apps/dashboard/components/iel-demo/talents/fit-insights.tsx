'use client';

import {
  FIT_INSIGHT_KIND_LABEL,
  type FitInsight,
  type FitInsightKind
} from '@/features/iel-demo/analysis/fit-insights';
import type { CriterionState } from '@/features/iel-demo/types';

import { cn } from '@workspace/ui';

import { CriterionStateDot } from '../shared/criterion-state-badge';
import { InfoHint } from '../shared/ui';

/**
 * Cada tipo de insight herda a cor do estado que o originou.
 *
 * O vocabulário de cores da Central já está estabelecido nos estados de
 * critério; inventar um segundo para os insights faria a mesma informação
 * mudar de cor entre dois blocos da mesma tela.
 */
const KIND_STATE: Record<FitInsightKind, CriterionState> = {
  atencao: 'divergencia',
  lacuna: 'sem-informacao',
  esclarecer: 'a-esclarecer',
  forte: 'alinhamento'
};

const KIND_TEXT_CLASS: Record<FitInsightKind, string> = {
  atencao: 'text-destructive',
  lacuna: 'text-muted-foreground',
  esclarecer: 'text-warning',
  forte: 'text-success'
};

/**
 * O que a leitura dos eixos diz, em ordem de atenção.
 *
 * Existe para que a aderência não fique sendo cinco linhas equivalentes que
 * alguém precisa hierarquizar de cabeça toda vez. A ordem vem do peso que a
 * empresa declarou e do estado de cada eixo — nunca de uma soma. O rótulo
 * diz que a leitura é determinística porque o briefing exige que quem usa
 * saiba que está numa demonstração, e porque uma regra explicável pode ser
 * contestada; um escore, não.
 */
export function FitInsights({ insights }: { insights: FitInsight[] }) {
  return (
    <div>
      <p className="iel-eyebrow flex items-center gap-1.5">
        Leitura assistida — determinística
        <InfoHint label="Gerada por regra a partir dos eixos e do peso declarado pela empresa, sem modelo de linguagem e sem nota. As mesmas informações produzem sempre a mesma leitura, e cada item diz de onde saiu." />
      </p>

      {insights.length === 0 ? (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Ainda não há eixos com os dois lados informados o suficiente para uma
          leitura. Não é um resultado desfavorável: é um espaço não mapeado.
        </p>
      ) : (
        <ul className="mt-2 space-y-3">
          {insights.map((insight) => (
            <li
              key={`${insight.kind}-${insight.axisId}`}
              className="flex gap-2.5"
            >
              <CriterionStateDot
                state={KIND_STATE[insight.kind]}
                className="mt-1.5"
              />
              <div className="min-w-0">
                <p
                  className={cn(
                    'text-[11px] font-semibold uppercase tracking-wide',
                    KIND_TEXT_CLASS[insight.kind]
                  )}
                >
                  {FIT_INSIGHT_KIND_LABEL[insight.kind]}
                </p>
                <p className="text-sm leading-snug text-foreground">
                  {insight.title}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {insight.detail}
                </p>
                {insight.evidence ? (
                  <blockquote className="mt-1.5 border-l-2 border-border pl-2.5 text-xs italic leading-relaxed text-muted-foreground">
                    “{insight.evidence}”
                  </blockquote>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
