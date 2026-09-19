'use client';

import { getFitAxis } from '@/features/iel-demo/analysis/fit-axes';
import {
  FIT_INSIGHT_KIND_LABEL,
  type FitInsight,
  type FitInsightKind
} from '@/features/iel-demo/analysis/fit-insights';

import {
  InsightCallout,
  type InsightCalloutKind
} from '../instruments/insight-callout';
import { InfoHint } from '../shared/ui';

/**
 * Os tipos coincidem hoje, e a tradução existe para que continuem podendo
 * divergir: o instrumento é presentacional e não deve importar o vocabulário
 * da regra de análise.
 */
const KIND: Record<FitInsightKind, InsightCalloutKind> = {
  atencao: 'atencao',
  lacuna: 'lacuna',
  esclarecer: 'esclarecer',
  forte: 'forte'
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
        <ul className="mt-2.5 space-y-2">
          {insights.map((insight) => (
            <li key={`${insight.kind}-${insight.axisId}`}>
              <InsightCallout
                kind={KIND[insight.kind]}
                /* Título curto: o estado e o eixo, para a lista ser varrida
                   de relance. A frase completa desce para o detalhe. */
                title={`${FIT_INSIGHT_KIND_LABEL[insight.kind]} — ${getFitAxis(insight.axisId).label}`}
                detail={
                  <>
                    <span className="block text-foreground">
                      {insight.title}
                    </span>
                    <span className="mt-1 block">{insight.detail}</span>
                  </>
                }
                evidence={insight.evidence}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
