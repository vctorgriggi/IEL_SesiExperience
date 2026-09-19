'use client';

import type { FitInsight } from '@/features/iel-demo/analysis/fit-insights';
import { AXIS_LABEL, COPY } from '@/features/iel-demo/copy';

import {
  InsightCallout,
  type InsightCalloutKind
} from '../instruments/insight-callout';
import { Explain, Panel, PanelHeader } from '../shared/ui';

/**
 * Os tipos coincidem hoje, e a tradução existe para que continuem podendo
 * divergir: o instrumento é presentacional e não deve importar o vocabulário
 * da regra de análise.
 */
const KIND: Record<FitInsight['kind'], InsightCalloutKind> = {
  atencao: 'atencao',
  lacuna: 'lacuna',
  esclarecer: 'esclarecer',
  forte: 'forte'
};

/** Cada item começa pelo ponto de que fala, em palavra comum. */
const KIND_LABEL: Record<FitInsight['kind'], string> = {
  atencao: 'ponto de atenção',
  lacuna: 'falta resposta',
  esclarecer: 'a confirmar com a empresa',
  forte: 'combina'
};

/**
 * O glossário aplicado ao texto que vem pronto da regra.
 *
 * As frases de `getFitInsights` ainda falam em "eixo" e "coleta dirigida" —
 * vocabulário de quem desenhou o instrumento, não de quem lê a tela. O texto
 * mora em `features/`, que é domínio de outra mão; enquanto ele não for
 * reescrito lá, a troca acontece aqui, na fronteira da apresentação, e é uma
 * lista curta e explícita justamente para desaparecer quando a origem mudar.
 */
const JARGAO: [RegExp, string][] = [
  [/\bcoleta dirigida\b/gi, 'uma pergunta à pessoa'],
  [/\beixos\b/gi, 'pontos do dia a dia'],
  [/\beixo\b/gi, 'ponto do dia a dia'],
  [/\bencaminhamento\b/gi, 'envio do currículo'],
  [/\baderência\b/gi, 'o quanto combina']
];

function semJargao(texto: string): string {
  return JARGAO.reduce(
    (frase, [padrao, troca]) => frase.replace(padrao, troca),
    texto
  );
}

/** Três já é uma leitura; cinco vira outro relatório para ler. */
const MAX_VISIVEIS = 3;

/**
 * Resumo do que a leitura dos cinco pontos diz, em ordem de atenção.
 *
 * Chamava-se "Leitura assistida — determinística", que é o nome do método e
 * não do que está na tela. O método continua explicado — regra fixa, sem
 * inteligência artificial paga —, agora atrás do `?`, uma linha em vez de um
 * parágrafo.
 */
export function FitInsights({ insights }: { insights: FitInsight[] }) {
  const visiveis = insights.slice(0, MAX_VISIVEIS);

  return (
    <Panel elevation={1}>
      <PanelHeader
        title={COPY.reading.label}
        hint={COPY.reading.hint}
      />

      {visiveis.length === 0 ? (
        <p className="iel-prose mt-3 text-sm leading-relaxed text-muted-foreground">
          Ainda não há ponto com os dois lados respondidos o suficiente para um
          resumo. Não é um resultado ruim: é um espaço em branco.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {visiveis.map((insight) => (
            <li key={`${insight.kind}-${insight.axisId}`}>
              <InsightCallout
                kind={KIND[insight.kind]}
                title={`${AXIS_LABEL[insight.axisId]} — ${KIND_LABEL[insight.kind]}`}
                detail={semJargao(insight.title)}
                evidence={insight.evidence}
              />
            </li>
          ))}
        </ul>
      )}

      {insights.length > visiveis.length ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Outros {insights.length - visiveis.length} pontos estão na lista
          acima, um a um.
        </p>
      ) : null}

      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        Montado por regra fixa, sem inteligência artificial paga.
        <Explain label="As mesmas respostas produzem sempre o mesmo resumo, e cada item diz de onde saiu." />
      </p>
    </Panel>
  );
}
