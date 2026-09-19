/**
 * Leitura assistida dos eixos de aderência.
 *
 * A tela do fit mostra cinco eixos com os dois lados frente a frente. É
 * legível, mas plana: nada ali diz por onde começar a conversa. O analista
 * relê os cinco toda vez e decide de cabeça o que importa — que é o trabalho
 * manual que a central existe para remover.
 *
 * Estes insights são a leitura que um analista faria, escrita por regra. Três
 * decisões moldam o que está aqui:
 *
 * **Nenhuma soma.** Não há nota, percentual nem ordenação de pessoas. O que
 * ordena é o peso que a empresa declarou e o estado de cada eixo: atenção
 * antes de lacuna, lacuna antes de confirmação. O briefing é explícito ao
 * vedar nota global, e somar cinco estados numa medida seria inventar a
 * ponderação que ele manda não inventar.
 *
 * **Determinística e explicável.** Cada insight vem de uma condição que cabe
 * numa frase, e a frase acompanha o insight na tela. O enunciado exige que a
 * recomendação seja auditável; uma leitura que ninguém consegue reproduzir
 * não é análise, é opinião com aparência de dado.
 *
 * **Sobre a situação, nunca sobre a pessoa.** Uma divergência é a condição da
 * equipe e a expectativa da pessoa que não coincidem — duas informações
 * legítimas em conflito, não um defeito de alguém. O texto aqui descreve o
 * encontro entre os dois lados, e não qualifica quem foi analisado.
 */

import type { FitReadingEntry } from '../state/selectors';
import type { AxisWeight } from '../types';
import type { FitAxisId } from './fit-axes';

export type FitInsightKind = 'forte' | 'atencao' | 'lacuna' | 'esclarecer';

export type FitInsight = {
  kind: FitInsightKind;
  axisId: FitAxisId;
  /** Uma linha: o que foi lido neste eixo. */
  title: string;
  /** O porquê, nos termos dos dois lados. */
  detail: string;
  /** Trecho que sustenta a leitura, quando há um lado informado. */
  evidence?: string;
};

export const FIT_INSIGHT_KIND_LABEL: Record<FitInsightKind, string> = {
  atencao: 'Ponto de atenção',
  lacuna: 'Lacuna em eixo prioritário',
  esclarecer: 'A confirmar com a empresa',
  forte: 'Aderência sustentada'
};

/** Quanto mais alto, mais cedo o insight aparece na lista. */
const KIND_RANK: Record<FitInsightKind, number> = {
  atencao: 0,
  lacuna: 1,
  esclarecer: 2,
  forte: 3
};

const WEIGHT_RANK: Record<AxisWeight, number> = {
  alto: 0,
  medio: 1,
  baixo: 2
};

/** Quantos insights cabem antes de a lista virar outro relatório para ler. */
const MAX_INSIGHTS = 5;

export function getFitInsights(
  reading: FitReadingEntry[],
  weights: Partial<Record<FitAxisId, AxisWeight>>
): FitInsight[] {
  const scored: { insight: FitInsight; weight: AxisWeight }[] = [];

  for (const entry of reading) {
    const weight = weights[entry.axis.id] ?? 'medio';
    const axisLabel = entry.axis.label.toLowerCase();

    // Divergência é o que muda a conversa: os dois lados informaram e o que
    // informaram não coincide. Aparece primeiro, e primeiro onde pesa mais.
    if (entry.state === 'divergencia') {
      scored.push({
        weight,
        insight: {
          kind: 'atencao',
          axisId: entry.axis.id,
          title: `A condição da equipe e a expectativa dela não coincidem em ${axisLabel}.`,
          detail:
            weight === 'alto'
              ? 'A empresa declarou este eixo como prioritário nesta vaga, então a diferença precisa ser tratada antes do encaminhamento — negociando a condição ou registrando que ela foi aceita.'
              : 'A diferença está registrada e não elimina a candidatura: cabe negociar a condição ou registrar que ela foi aceita pelos dois lados.',
          evidence: entry.condition?.value
        }
      });
      continue;
    }

    // Falta o lado da pessoa num eixo que a empresa priorizou: é a lacuna que
    // uma pergunta dirigida resolve em minutos — e a que, sem isso, vira
    // desempate improvisado na entrevista.
    if (
      weight === 'alto' &&
      (entry.missingSide === 'candidato' || entry.missingSide === 'ambos')
    ) {
      scored.push({
        weight,
        insight: {
          kind: 'lacuna',
          axisId: entry.axis.id,
          title: `Falta o lado da pessoa em ${axisLabel}, e este eixo é prioritário nesta vaga.`,
          detail: `Uma coleta dirigida resolve: “${entry.axis.talentQuestion}”. Sem essa resposta, a leitura do eixo fica em aberto — não em desfavor de ninguém.`
        }
      });
      continue;
    }

    if (weight === 'alto' && entry.state === 'a-esclarecer') {
      scored.push({
        weight,
        insight: {
          kind: 'esclarecer',
          axisId: entry.axis.id,
          title: `A condição da equipe em ${axisLabel} ainda não foi confirmada por quem poderia confirmar.`,
          detail: `Os dois lados informaram, mas o lado da empresa veio da descrição da vaga. Confirmar com a gestão: “${entry.axis.companyQuestion}”.`,
          evidence: entry.condition?.value
        }
      });
      continue;
    }

    // Alinhamento em eixo de peso baixo não é notícia: a empresa disse que
    // aquilo não decide a vaga.
    if (entry.state === 'alinhamento' && weight !== 'baixo') {
      scored.push({
        weight,
        insight: {
          kind: 'forte',
          axisId: entry.axis.id,
          title: `O que a equipe pratica em ${axisLabel} é o que ela declarou esperar.`,
          detail:
            'Os dois lados informaram, a condição está confirmada pela empresa e as descrições coincidem.',
          evidence: entry.preference?.value
        }
      });
    }
  }

  return scored
    .sort((a, b) => {
      const byKind = KIND_RANK[a.insight.kind] - KIND_RANK[b.insight.kind];
      if (byKind !== 0) return byKind;
      return WEIGHT_RANK[a.weight] - WEIGHT_RANK[b.weight];
    })
    .slice(0, MAX_INSIGHTS)
    .map((entry) => entry.insight);
}
