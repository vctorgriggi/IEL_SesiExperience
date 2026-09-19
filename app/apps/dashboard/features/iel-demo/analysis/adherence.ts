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
 * distância entre o que a empresa pratica e o que a pessoa procura, num
 * conjunto de cinco condições de trabalho declaradas. Não prediz desempenho,
 * não qualifica ninguém e não substitui o técnico nem o comportamental — o
 * próprio cliente disse que a aderência "soma com técnico e comportamental;
 * sozinha não garante encaminhamento" (R3).
 *
 * **O denominador fica visível.** `coverage` diz em quantos dos cinco eixos a
 * conta foi possível. Um total de 80% sobre dois eixos não é a mesma coisa
 * que 80% sobre cinco, e quem lê a tela precisa conseguir ver a diferença.
 *
 * **Onde falta um lado, não há número.** Se a empresa não fechou o perfil
 * naquele eixo, ou se a pessoa não respondeu, a aderência do eixo é `null` —
 * jamais zero. Zero é uma medida ("os dois lados estão nos extremos opostos");
 * ausência é outra coisa, e confundir as duas transformaria silêncio em
 * demérito.
 *
 * **A conta é explicável até o eixo.** LGPD, art. 20, § 1º: "O controlador
 * deverá fornecer, sempre que solicitadas, informações claras e adequadas a
 * respeito dos critérios e dos procedimentos utilizados para a decisão
 * automatizada, observados os segredos comercial e industrial". Por isso
 * `byAxis` devolve a média da empresa, a resposta da pessoa, a distância e o
 * peso: o analista consegue refazer o 41% à mão.
 */

import type { CultureOptionValue } from './culture';
import { CULTURE_SCALE_MAX, CULTURE_SCALE_MIN } from './culture';
import { FIT_AXES, type FitAxisId } from './fit-axes';

/**
 * Corte de compatibilidade, em pontos percentuais.
 *
 * Regra do cliente, dita na reunião de 19/09/2026 às 00:20:19: "o fit tem que
 * ter no mínimo 35% de aderência para ser compatível". Não foi descoberta por
 * modelo nem calibrada em dado nenhum, e está aqui como constante justamente
 * para que continue sendo uma decisão de alguém: quando houver devolutiva das
 * empresas (C3), o número se recalibra por decisão humana, não sozinho.
 *
 * É corte de atenção, não gatilho automático: quem fica abaixo continua
 * visível na mesa de seleção, marcado, e o analista decide.
 */
export const ADHERENCE_THRESHOLD = 35;

/** Amplitude da escala ordinal comum aos dois lados (1..3). */
const SCALE_RANGE = CULTURE_SCALE_MAX - CULTURE_SCALE_MIN;

/** Quanto cada peso declarado pela empresa conta na média do total. */
export const ADHERENCE_WEIGHT_FACTOR = {
  alto: 3,
  medio: 2,
  baixo: 1
} as const;

export type AdherenceWeight = keyof typeof ADHERENCE_WEIGHT_FACTOR;

/** Média da empresa por eixo: `null` onde o perfil não fechou. */
export type CompanyAxisMeans = Partial<Record<FitAxisId, number | null>>;

/** Resposta do candidato por eixo: ausente onde ele não respondeu. */
export type CandidateAxisValues = Partial<
  Record<FitAxisId, CultureOptionValue>
>;

export type AdherenceAxisEntry = {
  axisId: FitAxisId;
  /** 0..100, ou `null` quando falta um dos lados. */
  adherence: number | null;
  companyMean: number | null;
  candidateValue: CultureOptionValue | null;
  weight: AdherenceWeight;
  /** Distância absoluta entre os dois lados, na escala 1..3. */
  gap: number | null;
};

export type AdherenceResult = {
  byAxis: AdherenceAxisEntry[];
  /** Média ponderada dos eixos com os dois lados, ou `null`. */
  total: number | null;
  threshold: typeof ADHERENCE_THRESHOLD;
  /** `null` quando não há total: ausência de dado não reprova ninguém. */
  compatible: boolean | null;
  coverage: { answeredAxes: number; totalAxes: number };
};

/**
 * Aderência de um eixo, em pontos percentuais.
 *
 * ```
 * aderência = 100 × (1 − |médiaDaEmpresa − respostaDoCandidato| / (máx − mín))
 * ```
 *
 * com `máx − mín = 2`, a amplitude da escala ordinal de 1 a 3. Distância zero
 * dá 100; distância máxima (um lado em 1, o outro em 3) dá 0. É linear de
 * propósito: qualquer curva embutida aqui seria uma opinião sobre o quanto
 * cada degrau "dói", e ninguém mediu isso. Linear é a única forma que o
 * analista consegue refazer de cabeça.
 *
 * A média da empresa é contínua (1,375, por exemplo) e a resposta da pessoa é
 * um dos três degraus — a distância, portanto, também é contínua.
 */
export function computeAxisAdherence(
  companyMean: number,
  candidateValue: number
): number {
  const gap = Math.abs(companyMean - candidateValue);
  return 100 * (1 - gap / SCALE_RANGE);
}

/**
 * Aderência total e por eixo entre um perfil de empresa e uma resposta.
 *
 * Função pura: recebe os dois lados já resolvidos e os pesos. Quem monta isso
 * a partir do estado é `getAdherence`, em `state/selectors.ts` — separar as
 * duas coisas é o que permite testar a conta sem montar uma base inteira.
 */
export function computeAdherence(
  profile: CompanyAxisMeans,
  response: CandidateAxisValues | null,
  weights: Partial<Record<FitAxisId, AdherenceWeight>>
): AdherenceResult {
  const byAxis: AdherenceAxisEntry[] = FIT_AXES.map((axis) => {
    const companyMean = profile[axis.id] ?? null;
    const candidateValue = response?.[axis.id] ?? null;
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

  const measured = byAxis.filter(
    (entry): entry is AdherenceAxisEntry & { adherence: number } =>
      entry.adherence !== null
  );

  // Sem nenhum eixo com os dois lados não existe total. Preencher com zero, ou
  // com a média dos eixos que sobraram tratada como se fosse a dos cinco,
  // inventaria número onde falta lado — que é exatamente o que a seção de
  // privacidade por padrão do documento de produto proíbe.
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
    total,
    threshold: ADHERENCE_THRESHOLD,
    compatible: total === null ? null : total >= ADHERENCE_THRESHOLD,
    coverage: { answeredAxes: measured.length, totalAxes: FIT_AXES.length }
  };
}

/** Percentual como a tela mostra: inteiro, sem casa decimal falsa. */
export function formatAdherence(value: number | null): string {
  return value === null ? 'sem base' : `${Math.round(value)}%`;
}
