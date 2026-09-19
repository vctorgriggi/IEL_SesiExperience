/**
 * Como a base fictícia produz respostas ao instrumento.
 *
 * Cada empresa (ou papel dentro dela) e cada candidato têm um **alvo por
 * tema**: um valor de 1 a 5 no sentido do tema. A resposta a uma frase é o
 * alvo, espelhado nas frases de polo −1, com um ruído pequeno e
 * determinístico. As frases de desejabilidade social recebem "concordo" ou
 * "concordo muito" de quase todo mundo — é isso que as torna não
 * discriminantes. Alvos por frase existem para os casos em que um tema mistura
 * sentidos (a logística que reorganiza horário e, ao mesmo tempo, gosta de
 * trajetória estável).
 *
 * Nada aqui usa `Math.random()`: mesma semente, mesma base, a cada carga.
 */

import type { CultureRespondent } from '../analysis/culture';
import type { FitAxisId } from '../analysis/fit-axes';
import {
  ESCALA_MAX,
  ESCALA_MIN,
  getItem,
  type ItemDoInstrumento,
  type ValorDaEscala
} from '../analysis/instrumento';
import type { CultureAnswer } from '../types';

/** Gerador mulberry32: determinístico e sem dependência. */
export function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Alvo por tema e, quando preciso, por frase. */
export type AlvoCultural = {
  temas: Record<FitAxisId, number>;
  itens?: Partial<Record<string, number>>;
};

function paraEscala(valor: number): ValorDaEscala {
  return Math.min(
    ESCALA_MAX,
    Math.max(ESCALA_MIN, Math.round(valor))
  ) as ValorDaEscala;
}

/**
 * Uma resposta a uma frase.
 *
 * `espalhamento` é a amplitude do ruído, em pontos da escala: 0 responde o
 * alvo exato; 1 varia até um ponto para cada lado.
 */
export function responderFrase(
  item: ItemDoInstrumento,
  alvo: AlvoCultural,
  random: () => number,
  espalhamento = 0.9
): ValorDaEscala {
  if (!item.discrimina) return random() < 0.6 ? 5 : 4;
  const noTema = alvo.itens?.[item.id] ?? alvo.temas[item.tema];
  const naFrase =
    alvo.itens?.[item.id] !== undefined
      ? noTema
      : item.polo === 1
        ? noTema
        : ESCALA_MIN + ESCALA_MAX - noTema;
  const ruido = (random() + random() - 1) * espalhamento;
  return paraEscala(naFrase + ruido);
}

/** Uma resposta ainda por agregar: uma pessoa, uma frase. */
export type RespostaIndividual = {
  itemId: string;
  value: ValorDaEscala;
  respondent: CultureRespondent;
};

/**
 * Agrega respostas individuais em registros por frase, papel e valor.
 *
 * É assim que a consulta é gravada (PRODUTO.md §5.2): "cinco pessoas da
 * equipe marcaram concordo na frase I03" vira um registro com count 5, e
 * nada liga uma resposta a quem a deu.
 */
export function agregarRespostas(
  companyId: string,
  prefixo: string,
  respostas: RespostaIndividual[],
  answeredAt: (respondent: CultureRespondent) => string
): CultureAnswer[] {
  const grupos = new Map<string, CultureAnswer>();
  for (const resposta of respostas) {
    if (!getItem(resposta.itemId)) continue;
    const chave = `${resposta.itemId}-${resposta.respondent}-${resposta.value}`;
    const atual = grupos.get(chave);
    if (atual) {
      atual.count += 1;
      continue;
    }
    grupos.set(chave, {
      id: `${prefixo}-${chave}`,
      companyId,
      itemId: resposta.itemId,
      value: resposta.value,
      respondent: resposta.respondent,
      count: 1,
      answeredAt: answeredAt(resposta.respondent)
    });
  }
  return [...grupos.values()];
}

/** Respostas de um candidato às frases escolhidas para ele. */
export function responderQuestionario(
  itemIds: string[],
  alvo: AlvoCultural,
  random: () => number,
  espalhamento = 0.6
): Record<string, ValorDaEscala> {
  const respostas: Record<string, ValorDaEscala> = {};
  for (const itemId of itemIds) {
    const item = getItem(itemId);
    if (!item) continue;
    respostas[itemId] = responderFrase(item, alvo, random, espalhamento);
  }
  return respostas;
}
