/**
 * Motor de aderência (M4, R3).
 *
 * O briefing anterior ao cliente dizia para não produzir nota global de fit. O
 * IEL disse o contrário, com número: "o fit tem que ter no mínimo 35% de
 * aderência para ser compatível" (00:20:19). A decisão de produto foi
 * revogar o briefing nesse ponto, e este arquivo é a consequência.
 *
 * O que sobrevive da objeção original está no desenho:
 *
 * **O rótulo é "aderência", nunca "chance de sucesso".** O número mede a
 * distância entre o que a equipe da empresa responde e o que a pessoa
 * responde, frase a frase, nos 10 temas do instrumento do cliente. Não prediz
 * desempenho e não substitui o técnico nem o comportamental (R3).
 *
 * **O denominador fica visível.** `coverage` diz em quantos dos 10 temas a
 * conta foi possível. Um total de 80% sobre dois temas não é a mesma coisa
 * que 80% sobre dez.
 *
 * **Onde falta um lado, não há número.** Se a empresa não fechou a frase, ou
 * se a pessoa não respondeu, a aderência é `null` — jamais zero. Zero é uma
 * medida; ausência é outra coisa.
 *
 * **A conta é explicável até a frase.** LGPD, art. 20, § 1º: "O controlador
 * deverá fornecer, sempre que solicitadas, informações claras e adequadas a
 * respeito dos critérios e dos procedimentos utilizados para a decisão
 * automatizada, observados os segredos comercial e industrial". Por isso
 * `byItem` devolve, por frase, a média da empresa, a resposta da pessoa e a
 * distância; `byAxis` agrega por tema, com o peso da vaga.
 */

import { CULTURE_SCALE_MAX, CULTURE_SCALE_MIN } from './culture';
import { FIT_AXES, type FitAxisId } from './fit-axes';
import { alinharAoPolo, getItem, parDoItem } from './instrumento';

/**
 * Corte de compatibilidade, em pontos percentuais.
 *
 * Regra do cliente, dita na reunião de 19/09/2026 às 00:20:19: "o fit tem que
 * ter no mínimo 35% de aderência para ser compatível". Não foi descoberta por
 * modelo nem calibrada em dado nenhum, e está aqui como constante justamente
 * para que continue sendo uma decisão de alguém.
 *
 * É corte de atenção, não gatilho automático: quem fica abaixo continua
 * visível na mesa de seleção, marcado, e o analista decide.
 */
export const ADHERENCE_THRESHOLD = 35;

/** Amplitude da escala de concordância comum aos dois lados (1..5). */
const SCALE_RANGE = CULTURE_SCALE_MAX - CULTURE_SCALE_MIN;

/** Quanto cada peso declarado pela empresa conta na média do total. */
export const ADHERENCE_WEIGHT_FACTOR = {
  alto: 3,
  medio: 2,
  baixo: 1
} as const;

export type AdherenceWeight = keyof typeof ADHERENCE_WEIGHT_FACTOR;

/** Média da empresa por tema: `null` onde o perfil não fechou. */
export type CompanyAxisMeans = Partial<Record<FitAxisId, number | null>>;

/** Valor declarado pela pessoa por tema (no sentido do tema). */
export type CandidateAxisValues = Partial<Record<FitAxisId, number>>;

/** O que o motor precisa saber de cada frase do perfil da empresa. */
export type CompanyItemMeans = Record<
  string,
  { media: number | null; fecha: boolean }
>;

/** Resposta da pessoa por frase: `itemId → 1..5`. */
export type CandidateItemValues = Record<string, number>;

export type AdherenceItemEntry = {
  itemId: string;
  axisId: FitAxisId;
  /** 0..100, ou `null` quando a empresa não tem base na frase. */
  adherence: number | null;
  /** Média da empresa na escala da própria frase. */
  companyMean: number | null;
  candidateValue: number;
  /** Frase do par usada no lugar desta, quando esta não fechou. */
  viaPar: string | null;
};

export type AdherenceAxisEntry = {
  axisId: FitAxisId;
  /** 0..100, ou `null` quando falta um dos lados. */
  adherence: number | null;
  /** Média da empresa no sentido do tema, nas frases comparadas. */
  companyMean: number | null;
  /** Resposta da pessoa no sentido do tema. `null` se não respondeu. */
  candidateValue: number | null;
  weight: AdherenceWeight;
  /** Distância média entre os dois lados, na escala 1..5. */
  gap: number | null;
};

export type AdherenceResult = {
  byAxis: AdherenceAxisEntry[];
  /** Detalhe por frase respondida (vazio na comparação por tema). */
  byItem: AdherenceItemEntry[];
  /** Média ponderada dos temas com os dois lados, ou `null`. */
  total: number | null;
  threshold: typeof ADHERENCE_THRESHOLD;
  /** `null` quando não há total: ausência de dado não reprova ninguém. */
  compatible: boolean | null;
  coverage: { answeredAxes: number; totalAxes: number };
};

/**
 * Aderência numa frase, em pontos percentuais.
 *
 * ```
 * aderência = 100 × (1 − |médiaDaEmpresa − respostaDoCandidato| / 4)
 * ```
 *
 * com 4 = amplitude da escala de 1 a 5. Distância zero dá 100; um lado em
 * "discordo muito" e o outro em "concordo muito" dá 0. Linear de propósito:
 * é a única forma que o analista consegue refazer de cabeça.
 */
export function computeAxisAdherence(
  companyMean: number,
  candidateValue: number
): number {
  const gap = Math.abs(companyMean - candidateValue);
  return 100 * (1 - gap / SCALE_RANGE);
}

/** Mesmo cálculo, com o nome do que ele mede no instrumento novo. */
export const computeItemAdherence = computeAxisAdherence;

function mediaDe(valores: number[]): number | null {
  if (valores.length === 0) return null;
  return valores.reduce((soma, valor) => soma + valor, 0) / valores.length;
}

function finalizar(
  byAxis: AdherenceAxisEntry[],
  byItem: AdherenceItemEntry[]
): AdherenceResult {
  const measured = byAxis.filter(
    (entry): entry is AdherenceAxisEntry & { adherence: number } =>
      entry.adherence !== null
  );

  // Sem nenhum tema com os dois lados não existe total. Preencher com zero
  // inventaria número onde falta lado.
  const total =
    measured.length === 0
      ? null
      : measured.reduce(
          (sum, entry) =>
            sum + entry.adherence * ADHERENCE_WEIGHT_FACTOR[entry.weight],
          0
        ) /
        measured.reduce(
          (sum, entry) => sum + ADHERENCE_WEIGHT_FACTOR[entry.weight],
          0
        );

  return {
    byAxis,
    byItem,
    total,
    threshold: ADHERENCE_THRESHOLD,
    compatible: total === null ? null : total >= ADHERENCE_THRESHOLD,
    coverage: { answeredAxes: measured.length, totalAxes: FIT_AXES.length }
  };
}

/**
 * A média da empresa que serve de régua para uma frase.
 *
 * A própria, se fechou. Senão, a da outra frase do par, se ela fechou —
 * espelhada (6 − média) quando o par é invertido: concordar com "alternar sem
 * concluir" é discordar de "concluir uma antes de outra".
 */
function reguaDaEmpresa(
  itemId: string,
  profile: CompanyItemMeans
): { media: number; viaPar: string | null } | null {
  const propria = profile[itemId];
  if (propria?.fecha && propria.media !== null) {
    return { media: propria.media, viaPar: null };
  }
  const par = parDoItem(itemId);
  if (!par) return null;
  const doPar = profile[par.outro];
  if (!doPar?.fecha || doPar.media === null) return null;
  return {
    media: par.invertido
      ? CULTURE_SCALE_MIN + CULTURE_SCALE_MAX - doPar.media
      : doPar.media,
    viaPar: par.outro
  };
}

/**
 * Aderência entre o perfil da empresa e as respostas de uma pessoa, frase a
 * frase.
 *
 * Por frase: a distância linear acima. Por tema: a média das frases
 * respondidas que fecham. Total: a média dos temas ponderada pelo peso que a
 * vaga dá a cada um. Frases que não discriminam (desejabilidade social) não
 * pesam, mesmo que alguém as tenha respondido.
 */
export function computeAdherence(
  profile: CompanyItemMeans,
  response: CandidateItemValues | null,
  weights: Partial<Record<FitAxisId, AdherenceWeight>>
): AdherenceResult {
  const byItem: AdherenceItemEntry[] = [];

  for (const [itemId, candidateValue] of Object.entries(response ?? {})) {
    const item = getItem(itemId);
    if (!item || !item.discrimina) continue;
    const regua = reguaDaEmpresa(itemId, profile);
    byItem.push({
      itemId,
      axisId: item.tema,
      adherence: regua
        ? computeItemAdherence(regua.media, candidateValue)
        : null,
      companyMean: regua?.media ?? null,
      candidateValue,
      viaPar: regua?.viaPar ?? null
    });
  }

  const byAxis: AdherenceAxisEntry[] = FIT_AXES.map((axis) => {
    const weight = weights[axis.id] ?? 'medio';
    const doTema = byItem.filter((entry) => entry.axisId === axis.id);
    const comparados = doTema.filter(
      (entry): entry is AdherenceItemEntry & { companyMean: number } =>
        entry.companyMean !== null
    );

    const candidateValue = mediaDe(
      doTema.map((entry) =>
        alinharAoPolo(getItem(entry.itemId)!, entry.candidateValue)
      )
    );

    if (comparados.length === 0) {
      return {
        axisId: axis.id,
        adherence: null,
        companyMean: null,
        candidateValue,
        weight,
        gap: null
      };
    }

    const companyMean = mediaDe(
      comparados.map((entry) =>
        alinharAoPolo(getItem(entry.itemId)!, entry.companyMean)
      )
    );
    const pessoa = mediaDe(
      comparados.map((entry) =>
        alinharAoPolo(getItem(entry.itemId)!, entry.candidateValue)
      )
    );

    return {
      axisId: axis.id,
      adherence: mediaDe(comparados.map((entry) => entry.adherence!)),
      companyMean,
      candidateValue: pessoa,
      weight,
      gap: mediaDe(
        comparados.map((entry) =>
          Math.abs(entry.companyMean - entry.candidateValue)
        )
      )
    };
  });

  return finalizar(byAxis, byItem);
}

/**
 * Aderência por tema, quando o lado da pessoa é uma preferência declarada por
 * tema e não uma resposta frase a frase (o Mapa de Cultura, fora de qualquer
 * candidatura). Mesma régua linear, mesma ponderação, mesmo corte.
 */
export function computeThemeAdherence(
  profile: CompanyAxisMeans,
  values: CandidateAxisValues | null,
  weights: Partial<Record<FitAxisId, AdherenceWeight>>
): AdherenceResult {
  const byAxis: AdherenceAxisEntry[] = FIT_AXES.map((axis) => {
    const companyMean = profile[axis.id] ?? null;
    const candidateValue = values?.[axis.id] ?? null;
    const weight = weights[axis.id] ?? 'medio';

    if (companyMean === null || candidateValue === null) {
      return {
        axisId: axis.id,
        adherence: null,
        companyMean,
        candidateValue,
        weight,
        gap: null
      };
    }

    return {
      axisId: axis.id,
      adherence: computeAxisAdherence(companyMean, candidateValue),
      companyMean,
      candidateValue,
      weight,
      gap: Math.abs(companyMean - candidateValue)
    };
  });

  return finalizar(byAxis, []);
}

/** Resultado vazio: sem candidatura, sem vaga ou sem resposta. */
export function emptyAdherence(): AdherenceResult {
  return finalizar(
    FIT_AXES.map((axis) => ({
      axisId: axis.id,
      adherence: null,
      companyMean: null,
      candidateValue: null,
      weight: 'medio' as const,
      gap: null
    })),
    []
  );
}

/** Percentual como a tela mostra: inteiro, sem casa decimal falsa. */
export function formatAdherence(value: number | null): string {
  return value === null ? 'sem base' : `${Math.round(value)}%`;
}
