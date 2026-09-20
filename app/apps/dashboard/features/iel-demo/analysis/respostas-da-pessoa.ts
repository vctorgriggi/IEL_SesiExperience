/**
 * As respostas ao instrumento, do ponto de vista da pessoa.
 *
 * Até aqui, a resposta do candidato nascia presa à candidatura e morria com a
 * vaga. Duas consequências, uma prática e uma conceitual.
 *
 * A prática: a mesma pessoa, que se candidata a várias vagas, respondia as
 * frases de novo a cada candidatura. O público é operacional, com baixo
 * letramento digital, e trava em plataforma (00:08:01) — era atrito no lugar
 * mais caro do funil.
 *
 * A conceitual: o que a pessoa responde é **como ela prefere trabalhar**, e
 * isso é dela, não da vaga. "Aplicar um fit cultural, ele tem a ver com a
 * cultura da empresa que está nos contratando. Não tem a ver com o que eu
 * gosto ou não, porque o que eu gosto ou não é o candidato" (Coringa,
 * 00:19:47). O que muda de empresa para empresa é o outro lado: o perfil dela
 * e **quais frases ela escolheu**.
 *
 * ## A modelagem, e por que é esta
 *
 * A resposta continua gravada em `CandidateFitResponse`, um registro por
 * candidatura, agora com `talentId`. Não há uma segunda tabela de respostas
 * por pessoa, e isso é deliberado: duas cópias do mesmo dado divergem, e a
 * primeira divergência entre "o que a pessoa respondeu" e "o que a
 * candidatura usou" seria um número que ninguém consegue explicar.
 *
 * O dono e o instante vêm do registro em que a frase foi respondida: quem
 * respondeu é `talentId`, quando é `answeredAt`, e sob qual texto de aceite é
 * `consent.version`. A candidatura fica onde importa — é por ela que o link
 * chega e é ela que dá o contexto —, mas a pergunta "o que **esta pessoa**
 * respondeu" passa a ser respondida por `indexarRespostasPorPessoa`, que lê
 * todos os registros dela de uma vez. É a fonte de verdade, e o índice existe
 * para que ela seja barata: a base tem milhares de candidaturas, e varrer a
 * lista a cada render seria O(n²) por tela.
 *
 * ## As regras
 *
 * 1. **Vale a última.** Duas respostas da mesma pessoa à mesma frase, a mais
 *    recente ganha — em qualquer candidatura. É o que o aceite promete como
 *    forma de desfazer: "responda de novo e vale sempre a sua última
 *    resposta".
 * 2. **Fora da validade é como se não existisse.** Passados
 *    `VALIDADE_DA_RESPOSTA_MESES`, a frase volta a ser perguntada, inclusive
 *    na candidatura em que a resposta foi dada. Retenção é prazo, não
 *    intenção: uma resposta vencida que continuasse alimentando a aderência
 *    seria a promessa dos 12 meses valendo só no texto.
 * 3. **Aceite antigo não viaja.** A resposta dada sob uma versão de aceite
 *    que não previa reuso continua valendo na candidatura em que foi dada e
 *    nunca vai para outra (`aceitePermiteReuso`).
 * 4. **Ausência não é zero.** O que falta sai em `faltantes` e vira pergunta;
 *    nunca vira valor. Quem lê `valores` recebe só frase com resposta válida,
 *    e `computeAdherence` continua distinguindo "a pessoa não respondeu" de
 *    "a empresa não fechou o tema".
 */

import type { CandidateFitResponse } from '../types';
import {
  aceitePermiteReuso,
  respostaDentroDaValidade,
  validaAte
} from './candidate-questionnaire';
import type { ValorDaEscala } from './instrumento';

/** Uma resposta de frase: de quem é, quando foi dada e sob qual aceite. */
export type RespostaDeFrase = {
  itemId: string;
  value: ValorDaEscala;
  /** A pessoa. É dela que a resposta é. */
  talentId: string;
  /** Candidatura em que foi dada: procedência e contexto, não dono. */
  applicationId: string;
  answeredAt: string;
  consentVersion: string;
  /** Último dia em que esta resposta pode ser usada (YYYY-MM-DD). */
  validaAte: string;
};

/** O que uma pessoa respondeu, frase a frase. Inclui respostas vencidas. */
export type RespostasDaPessoa = {
  talentId: string;
  /** Frase → a resposta mais recente da pessoa àquela frase. */
  porFrase: Map<string, RespostaDeFrase>;
};

/** Pessoa → o que ela respondeu. */
export type IndiceDeRespostas = Map<string, RespostasDaPessoa>;

/**
 * Índice pessoa → frase → resposta mais recente.
 *
 * Uma passada por todos os registros, uma vez; quem chama guarda o resultado
 * enquanto a lista de respostas não mudar (ver `state/selectors.ts`).
 */
export function indexarRespostasPorPessoa(
  responses: readonly CandidateFitResponse[]
): IndiceDeRespostas {
  const indice: IndiceDeRespostas = new Map();

  for (const response of responses) {
    let daPessoa = indice.get(response.talentId);
    if (!daPessoa) {
      daPessoa = { talentId: response.talentId, porFrase: new Map() };
      indice.set(response.talentId, daPessoa);
    }

    for (const [itemId, value] of Object.entries(response.answers)) {
      const anterior = daPessoa.porFrase.get(itemId);
      if (anterior && anterior.answeredAt >= response.answeredAt) continue;
      daPessoa.porFrase.set(itemId, {
        itemId,
        value,
        talentId: response.talentId,
        applicationId: response.applicationId,
        answeredAt: response.answeredAt,
        consentVersion: response.consent.version,
        validaAte: validaAte(response.answeredAt)
      });
    }
  }

  return indice;
}

/** De onde veio a resposta que esta candidatura está usando. */
export type OrigemDaResposta = 'desta-candidatura' | 'reaproveitada';

export type FraseResolvida = RespostaDeFrase & { origem: OrigemDaResposta };

/** Por que uma resposta que existe não pôde ser usada. */
export type MotivoDoDescarte = 'vencida' | 'aceite-anterior';

export type RespostaDescartada = RespostaDeFrase & {
  motivo: MotivoDoDescarte;
};

export type RespostasResolvidas = {
  /** Frases que esta empresa escolheu perguntar. */
  perguntadas: string[];
  /** O que o motor de aderência lê: frase → valor, só o que vale hoje. */
  valores: Record<string, ValorDaEscala>;
  /** As frases resolvidas, com procedência. */
  respondidas: FraseResolvida[];
  /** O recorte das que vieram de outra candidatura da mesma pessoa. */
  reaproveitadas: FraseResolvida[];
  /** As respondidas nesta candidatura mesmo. */
  novas: FraseResolvida[];
  /** Frases perguntadas que continuam sem resposta válida. */
  faltantes: string[];
  /** Respostas que existiam e não puderam ser usadas, com o motivo. */
  descartadas: RespostaDescartada[];
  /** Data da resposta reaproveitada mais antiga (ISO), ou `null`. */
  reaproveitadasDesde: string | null;
  /** Até quando a mais antiga das reaproveitadas vale (YYYY-MM-DD). */
  reaproveitadasValemAte: string | null;
};

function usavel(
  resposta: RespostaDeFrase,
  applicationId: string,
  agoraIso: string
): MotivoDoDescarte | null {
  // A validade vem primeiro porque é o prazo que o aceite promete, e vale
  // até para a candidatura em que a resposta foi dada.
  if (!respostaDentroDaValidade(resposta.answeredAt, agoraIso))
    return 'vencida';
  if (
    resposta.applicationId !== applicationId &&
    !aceitePermiteReuso(resposta.consentVersion)
  )
    return 'aceite-anterior';
  return null;
}

/**
 * O conjunto resolvido de uma candidatura: o que já está respondido, o que
 * veio de antes e o que ainda falta perguntar.
 *
 * `propria` entra além do índice porque o índice guarda só a resposta mais
 * recente por frase: se a mais recente vier de uma candidatura cujo aceite
 * não permite reuso, a resposta que a própria candidatura tem continua
 * valendo para ela, e seria errado perguntar de novo o que a pessoa já
 * respondeu ali.
 */
export function resolverRespostas(params: {
  /** As frases que a empresa desta vaga escolheu (`perguntasDoCandidato`). */
  itemIds: readonly string[];
  applicationId: string;
  /** O registro desta candidatura, quando existe. */
  propria: CandidateFitResponse | null;
  /** O que a pessoa respondeu em qualquer candidatura. */
  daPessoa: RespostasDaPessoa | undefined;
  /** Data de referência: sempre o relógio determinístico da demonstração. */
  agoraIso: string;
}): RespostasResolvidas {
  const { itemIds, applicationId, propria, daPessoa, agoraIso } = params;

  const valores: Record<string, ValorDaEscala> = {};
  const respondidas: FraseResolvida[] = [];
  const faltantes: string[] = [];
  const descartadas: RespostaDescartada[] = [];

  for (const itemId of itemIds) {
    const candidatas: RespostaDeFrase[] = [];

    const valorProprio = propria?.answers[itemId];
    if (valorProprio !== undefined) {
      candidatas.push({
        itemId,
        value: valorProprio,
        talentId: propria!.talentId,
        applicationId: propria!.applicationId,
        answeredAt: propria!.answeredAt,
        consentVersion: propria!.consent.version,
        validaAte: validaAte(propria!.answeredAt)
      });
    }

    const maisRecente = daPessoa?.porFrase.get(itemId);
    if (maisRecente && maisRecente.applicationId !== applicationId) {
      candidatas.push(maisRecente);
    }

    const aproveitaveis = candidatas.filter((candidata) => {
      const motivo = usavel(candidata, applicationId, agoraIso);
      if (motivo) descartadas.push({ ...candidata, motivo });
      return motivo === null;
    });

    if (aproveitaveis.length === 0) {
      faltantes.push(itemId);
      continue;
    }

    // Vale a última: é assim que a pessoa desfaz uma resposta antiga.
    const escolhida = aproveitaveis.reduce((atual, candidata) =>
      candidata.answeredAt > atual.answeredAt ? candidata : atual
    );

    valores[itemId] = escolhida.value;
    respondidas.push({
      ...escolhida,
      origem:
        escolhida.applicationId === applicationId
          ? 'desta-candidatura'
          : 'reaproveitada'
    });
  }

  const reaproveitadas = respondidas.filter(
    (frase) => frase.origem === 'reaproveitada'
  );
  const maisAntiga = reaproveitadas.reduce<string | null>(
    (atual, frase) =>
      atual === null || frase.answeredAt < atual ? frase.answeredAt : atual,
    null
  );

  return {
    perguntadas: [...itemIds],
    valores,
    respondidas,
    reaproveitadas,
    novas: respondidas.filter((frase) => frase.origem === 'desta-candidatura'),
    faltantes,
    descartadas,
    reaproveitadasDesde: maisAntiga,
    reaproveitadasValemAte: maisAntiga === null ? null : validaAte(maisAntiga)
  };
}
