/**
 * Acompanhamento de quem foi contratado: a pessoa como segunda fonte.
 *
 * A devolutiva de um clique (C3, `devolutiva.ts`) pergunta à empresa
 * "contratou?" e, aos 90 dias, "ficou?". Mas o cliente foi claro: "o RH não
 * dá retorno pra gente, de contratado" (00:05:33) e "eles não dão retorno"
 * (00:35:28). Enquanto só a empresa puder dizer se a pessoa ficou, o dado de
 * permanência continua refém dela.
 *
 * Este módulo cria a segunda metade do ciclo: perguntar **à própria pessoa**,
 * aos 30, 60 e 90 dias, por link no celular — "Você continua na empresa? Como
 * está sendo?". Dá ao IEL uma fonte que não depende do RH e dá ao candidato um
 * cuidado que hoje ele não recebe depois de contratado.
 *
 * ## O que a pessoa responde é dela
 *
 * A empresa **nunca** vê a resposta (PRODUTO.md §5.1). É a única forma de a
 * pessoa responder com verdade sobre o próprio emprego: quem sabe que o chefe
 * vai ler não diz que o turno mudou e o transporte não deu. Por isso a
 * finalidade é nova, o aceite é próprio e a versão dele fica gravada em cada
 * resposta (LGPD, art. 7º, I; art. 8º, § 4º).
 *
 * ## Duas fontes, nenhuma sobrescreve a outra
 *
 * Quando a pessoa diz que saiu e a empresa não avisou nada — ou diz que ela
 * continua —, as duas respostas ficam registradas com a fonte, e a divergência
 * aparece para a analista. É diagnóstico, como gestão × equipe no mapa de
 * cultura: o dado interessante é justamente a diferença. Para o indicador, a
 * regra é conservadora — vale a saída (`analytics.ts`).
 *
 * ## O que este módulo não faz
 *
 * Não acompanha a pessoa *dentro* da empresa (PRODUTO.md §10): não pergunta
 * de chefe, de equipe, de saúde nem de família. Duas respostas curtas e um
 * comentário opcional, e o comentário é sobre o trabalho, não sobre pessoas.
 */

/* ------------------------------------------------------------------ *
 * Marcos
 * ------------------------------------------------------------------ */

/**
 * Os três momentos em que o IEL pergunta. O de 90 coincide com a janela de
 * permanência que a empresa responde (`PERMANENCIA_DIAS`), de propósito: é a
 * mesma pergunta, feita aos dois lados.
 */
export const MARCOS_DO_ACOMPANHAMENTO = [30, 60, 90] as const;
export type MarcoDoAcompanhamento = (typeof MARCOS_DO_ACOMPANHAMENTO)[number];

/**
 * Quanto tempo um marco fica aberto para resposta: do dia do marco até o
 * marco seguinte. Como os marcos são espaçados de 30 em 30, o de 90 também
 * fica aberto 30 dias (até o dia 120). Depois disso o marco não respondido
 * vira "perdido": deixa de ser pendência e não volta a ser cobrado, senão a
 * lista da analista acumularia pendências eternas de quem nunca vai responder.
 */
export const JANELA_DO_MARCO_DIAS = 30;

/* ------------------------------------------------------------------ *
 * Check-in
 * ------------------------------------------------------------------ */

/** "Como está sendo?" — 1 muito ruim … 5 muito bom. */
export type ComoEstaSendo = 1 | 2 | 3 | 4 | 5;

/** Um check-in respondido pela própria pessoa. */
export type CheckIn = {
  id: string;
  applicationId: string;
  talentId: string;
  marco: MarcoDoAcompanhamento;
  /** ISO completo. */
  respondidoEm: string;
  /** "Você continua na empresa?" */
  continua: boolean;
  /** "Como está sendo?" (1 muito ruim … 5 muito bom). */
  comoEstaSendo: ComoEstaSendo;
  /** Livre, opcional, curto. Sobre o trabalho, não sobre pessoas. */
  comentario?: string;
  /** Versão do aceite sob o qual a pessoa respondeu. */
  consentVersion: string;
};

export const COMO_ESTA_SENDO_LABEL: Record<ComoEstaSendo, string> = {
  1: 'Muito ruim',
  2: 'Ruim',
  3: 'Mais ou menos',
  4: 'Bom',
  5: 'Muito bom'
};

/** Tamanho máximo do comentário. Curto de propósito: é um recado, não um relato. */
export const COMENTARIO_MAX = 200;

/* ------------------------------------------------------------------ *
 * Aceite
 * ------------------------------------------------------------------ */

/**
 * Versão do texto de aceite. Muda sempre que o texto mudar: o que a pessoa
 * aceitou precisa ser demonstrável (LGPD, art. 8º, § 4º), e a versão gravada
 * na resposta é o que prova sob qual texto ela respondeu.
 */
export const CHECK_IN_CONSENT_VERSION = '2026-09-22';

/**
 * O texto que a pessoa lê antes de responder (PRODUTO.md §5.3 e §5.6).
 *
 * Palavra comum, sem juridiquês. Quem abre o link está no celular, no
 * intervalo. Diz para quê, o que coletamos, quem vê, por quanto tempo e o que
 * ela pode fazer. O "quem vê" é a frase mais importante da tela: a empresa
 * nunca vê.
 */
export const CHECK_IN_CONSENT_TEXT: {
  title: string;
  purpose: string;
  collected: string;
  whoSees: string;
  retention: string;
  rights: string;
} = {
  title: 'Antes de responder',
  purpose:
    'O IEL quer saber se a contratação está dando certo para você e usar isso para melhorar como escolhe quem indica para cada vaga.',
  collected:
    'Guardamos só as suas duas respostas — se você continua na empresa e como está sendo — e um comentário, se você quiser deixar.',
  whoSees:
    'Quem vê é a equipe do IEL. A empresa nunca vê o que você respondeu.',
  retention:
    'Suas respostas ficam guardadas por até 12 meses depois da contratação. Depois disso são apagadas.',
  rights:
    'Você pode parar de receber estas perguntas quando quiser e pode pedir para apagar o que respondeu. É só falar com o IEL.'
};

/* ------------------------------------------------------------------ *
 * Situação de uma contratação
 * ------------------------------------------------------------------ */

/** De quem veio o que se sabe sobre a permanência. */
export type FonteDaPermanencia = 'empresa' | 'pessoa' | 'ambos';

/** Situação de uma candidatura contratada, para as telas do candidato e da analista. */
export type SituacaoDeContratacao = {
  applicationId: string;
  talentId: string;
  companyId: string;
  jobId: string;
  /** Data em que a empresa clicou "contratei". */
  contratadoEm: string;
  /** Relativo a `nowIso()`. */
  diasNaEmpresa: number;
  /** O marco que está aberto para responder, se houver. */
  marcoAtual: MarcoDoAcompanhamento | null;
  /** O próximo ainda não alcançado. */
  proximoMarco: MarcoDoAcompanhamento | null;
  /** Já respondidos, em ordem de marco. */
  checkIns: CheckIn[];
  /** Marcos alcançados, dentro da janela e não respondidos. */
  pendentes: MarcoDoAcompanhamento[];
  /** Marcos cuja janela fechou sem resposta. Não voltam a ser cobrados. */
  perdidos: MarcoDoAcompanhamento[];
  /** O que se sabe da permanência, e de quem veio. */
  permanencia: {
    estado: 'continua' | 'saiu' | 'sem-informacao';
    fonte: FonteDaPermanencia | null;
    /** Quando a informação mais recente foi dada. */
    em: string | null;
  };
  /** Empresa e pessoa discordam? (uma diz que ficou, a outra que saiu) */
  divergencia: boolean;
  /**
   * O que cada lado disse, separado. Quando há divergência, `permanencia`
   * já assumiu a saída; é aqui que a tela diz quem falou o quê ("a empresa
   * não informou nada; a pessoa contou que saiu").
   */
  porFonte: {
    empresa: 'continua' | 'saiu' | null;
    pessoa: 'continua' | 'saiu' | null;
  };
};

/* ------------------------------------------------------------------ *
 * Regras de marco
 * ------------------------------------------------------------------ */

/** Marco alcançado: a pessoa já tem pelo menos `marco` dias na empresa. */
export function marcoAlcancado(
  marco: MarcoDoAcompanhamento,
  diasNaEmpresa: number
): boolean {
  return diasNaEmpresa >= marco;
}

/**
 * Marco aberto: alcançado e ainda dentro da janela de resposta.
 *
 * Fechado o intervalo à esquerda e aberto à direita — no dia 60 o marco de
 * 30 já fechou e o de 60 abriu; nunca há dois abertos ao mesmo tempo.
 */
export function marcoAberto(
  marco: MarcoDoAcompanhamento,
  diasNaEmpresa: number
): boolean {
  return diasNaEmpresa >= marco && diasNaEmpresa < marco + JANELA_DO_MARCO_DIAS;
}

/** Marco perdido: a janela fechou. */
export function marcoPerdido(
  marco: MarcoDoAcompanhamento,
  diasNaEmpresa: number
): boolean {
  return diasNaEmpresa >= marco + JANELA_DO_MARCO_DIAS;
}

/** Rótulo do marco, na voz da tela. */
export function rotuloDoMarco(marco: MarcoDoAcompanhamento): string {
  return `${marco} dias`;
}

/** Verdadeiro para um valor dentro da escala de "como está sendo". */
export function ehComoEstaSendo(valor: unknown): valor is ComoEstaSendo {
  return (
    typeof valor === 'number' &&
    Number.isInteger(valor) &&
    valor >= 1 &&
    valor <= 5
  );
}

/** Verdadeiro para um marco conhecido. */
export function ehMarco(valor: unknown): valor is MarcoDoAcompanhamento {
  return (MARCOS_DO_ACOMPANHAMENTO as readonly number[]).includes(
    valor as number
  );
}
