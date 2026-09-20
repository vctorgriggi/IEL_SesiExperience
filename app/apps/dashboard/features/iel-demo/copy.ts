/**
 * Glossário da Central, em código.
 *
 * O documento de design tem uma tabela "Evitar / Usar": quem lê as telas é a
 * analista, o RH de uma indústria e um candidato operacional no celular, e
 * nenhum dos três é analista de dados. Palavra interna ("aderência", "eixo",
 * "traçado cultural", "encaminhamento") não chega a eles.
 *
 * O texto mora aqui, e não espalhado pelas telas, porque a mesma ideia
 * aparece em cinco lugares: com o termo num arquivo só, trocar a palavra é
 * uma edição, e não uma caçada. O domínio continua com os nomes técnicos —
 * `adherence`, `FitAxisId` — porque o código precisa deles; o que muda é
 * exclusivamente o que a pessoa lê.
 */

import { FIT_AXES, type FitAxisId } from './analysis/fit-axes';

/** Como cada estado é dito em texto, já que cor sozinha não informa nada. */
export type EstadoDeLeitura =
  | 'combina'
  | 'difere'
  | 'faltando'
  | 'sem-resposta';

const COMBINA_COM_A_EMPRESA = 'combina com a empresa';
const SEM_RESPOSTA = 'ainda não respondeu';

export const ESTADO_LABEL: Record<EstadoDeLeitura, string> = {
  combina: 'Combina',
  difere: 'Difere',
  faltando: 'Faltam respostas',
  'sem-resposta': 'Ainda não respondeu'
};

/**
 * A frase que interpreta o número.
 *
 * "49%" sozinho não diz nada a quem nunca viu o produto; "49% — combina com a
 * empresa" diz. `total` nulo não vira zero: silêncio não é demérito, é
 * ausência de medida, e a frase precisa dizer isso com todas as letras.
 */
export function verdict(total: number | null, threshold: number): string {
  if (total === null) return SEM_RESPOSTA;
  return `${Math.round(total)}% — ${verdictSentence(total, threshold)}`;
}

/** Só a frase, para quem já mostra o número num corpo maior ao lado. */
export function verdictSentence(
  total: number | null,
  threshold: number
): string {
  if (total === null) return SEM_RESPOSTA;
  return total >= threshold
    ? COMBINA_COM_A_EMPRESA
    : `abaixo do mínimo de ${Math.round(threshold)}%`;
}

/** O estado que a frase de `verdict` carrega, para cor e ícone acompanharem. */
export function verdictState(
  total: number | null,
  threshold: number
): EstadoDeLeitura {
  if (total === null) return 'sem-resposta';
  return total >= threshold ? 'combina' : 'difere';
}

/**
 * "Faltam respostas (2 de 5)" no lugar de "o perfil não fecha".
 *
 * `respondidas` é quanto já chegou e `total` é quanto se espera — a ordem é a
 * da fala ("2 de 5"), não a do que falta, porque é assim que o contador
 * aparece na tela ao lado.
 */
export function missingAnswers(respondidas: number, total: number): string {
  if (total <= 0) return SEM_RESPOSTA;
  if (respondidas >= total) return `${total} de ${total} — respondido`;
  return `Faltam respostas — ${respondidas} de ${total}`;
}

/**
 * Rótulo de cada um dos 11 temas: o tópico da planilha do cliente, em caixa
 * de frase (`FitAxis.label`). O nome é dele, não nosso.
 */
export const AXIS_LABEL: Record<FitAxisId, string> = Object.fromEntries(
  FIT_AXES.map((axis) => [axis.id, axis.label])
) as Record<FitAxisId, string>;

/**
 * O mesmo tema em uma ou duas palavras, cortadas do nome do cliente — nunca
 * um nome inventado ("Regras e decisão" sai de "Regras, métodos e decisão").
 *
 * Só para onde o espaço é do desenho, e não do texto: em volta do radar, um
 * rótulo de cinco palavras ou é cortado ou encolhe o polígono, e com
 * onze temas em volta o espaço de cada um é ainda menor; o mesmo vale para
 * chips e barrinhas de celular. O nome inteiro continua ao lado, na lista
 * que acompanha o gráfico.
 */
export const AXIS_SHORT_LABEL: Record<FitAxisId, string> = {
  'orientacao-resultados': 'Resultados',
  inovacao: 'Inovação',
  'aprendizado-desenvolvimento': 'Aprendizado',
  'foco-cliente': 'Foco no cliente',
  'etica-seguranca': 'Ética e segurança',
  'execucao-ritmo': 'Execução e ritmo',
  'regras-decisao': 'Regras e decisão',
  'interacao-convivencia': 'Convivência',
  'lideranca-autonomia': 'Liderança e autonomia',
  'adaptacao-carreira': 'Adaptação e carreira',
  'expectativas-futuras': 'Expectativas'
};

export const COPY = {
  fit: {
    label: 'Combina com a empresa',
    /** Complemento da frase interpretativa: "49% — combina com a empresa". */
    combina: COMBINA_COM_A_EMPRESA,
    naoCombina: 'abaixo do mínimo',
    semResposta: SEM_RESPOSTA,
    hint: 'Compara como a equipe da empresa prefere trabalhar com como a pessoa prefere trabalhar, nos 11 temas. Não é nota, não mede desempenho.'
  },
  technical: {
    label: 'Requisitos da vaga',
    hint: 'Percentual que o sistema de vagas já calcula sobre os requisitos técnicos. Vem da planilha, não é recalculado aqui.'
  },
  axes: {
    label: 'Os 11 temas',
    singular: 'tema',
    hint: 'Onze temas do jeito de trabalhar, respondidos pelos dois lados com as mesmas frases.'
  },
  culture: {
    label: 'Como a empresa trabalha',
    sample: 'A média das respostas de quem trabalha na empresa.',
    divergence: 'Gestão e equipe respondem diferente'
  },
  questions: {
    label: 'Perguntas pendentes',
    ask: 'Perguntar à pessoa',
    askManager: 'Perguntar ao gestor'
  },
  referral: {
    label: 'Currículos enviados',
    action: 'Enviar currículos',
    limit: 'No máximo 5 currículos por vaga.'
  },
  sources: {
    label: 'De onde vem',
    hint: 'Cada registro guarda de qual sistema veio e quando chegou.'
  },
  reading: {
    label: 'Resumo',
    hint: 'Texto montado por regra fixa a partir das respostas. Não usa inteligência artificial paga.'
  },
  filter: {
    label: 'Filtrar'
  },
  verdict,
  verdictSentence,
  verdictState,
  missingAnswers,
  axis: (axisId: FitAxisId): string => AXIS_LABEL[axisId],
  estado: (estado: EstadoDeLeitura): string => ESTADO_LABEL[estado]
} as const;
