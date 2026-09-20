/**
 * Em que pé está a candidatura, na língua de quem se candidatou.
 *
 * O produto tinha uma assimetria: a pessoa respondia 10 frases, apertava
 * enviar e acabava ali. Não sabia se tinha sido encaminhada, não sabia o que
 * viria depois e, quando a empresa não seguia, ninguém lhe dizia nada. O
 * cliente já se importa com isso — o limite de 5 currículos por vaga existe
 * "para trabalhar com a expectativa do candidato" (00:33:30).
 *
 * Este módulo traduz o estado que o IEL já guarda (resposta do questionário,
 * prazo, encaminhamento, decisão da empresa) em uma situação com quatro
 * partes: o que é, por que é, **o que acontece agora** e o caminho de seguir.
 * Nenhuma situação termina em silêncio: `agora` nunca vem vazio.
 *
 * ## O que este módulo nunca produz
 *
 * - **Nome da empresa** (R5, 00:22:21 e 00:38:43). Nem quando ela quer
 *   entrevistar: quem revela o nome é a pessoa do IEL, no contato. Por isso
 *   nada aqui lê `Company`; a vaga chega pela porta fechada de
 *   `getCandidateJobView`.
 * - **Posição, ranking ou comparação com outros candidatos.** O produto
 *   inteiro é construído para não classificar pessoas; a tela de quem mais
 *   sofreria com uma classificação é o último lugar onde ela poderia
 *   aparecer.
 * - **Motivo interno.** A justificativa que a empresa escreve ao decidir
 *   (`ReferralItem.managerNote`) é devolutiva dela para o IEL — PRODUTO.md
 *   §5.1 põe o candidato fora dessa linha. Aqui ela nem é lida.
 * - **Percentual, comparação ou leitura sobre a pessoa.** O que volta para
 *   ela é o que ela respondeu, frase a frase, no vocabulário da escala
 *   (`shared/suas-respostas`). "Combinou em X, ficou diferente em Y" saiu:
 *   é comparação, e comparação numa tela sobre a própria vida vira nota.
 *
 * ## Vocabulário
 *
 * "Encaminhamento" vira **currículo enviado**, "aderência" vira **combina com
 * a empresa**, "eixo" vira **tema**: o glossário de `copy.ts` e da seção 3 do
 * documento de design. Frases curtas, voz ativa, uma ideia por frase — o
 * público é operacional e trava em plataforma (00:08:01).
 */

import {
  CANDIDATE_FIT_DEADLINE_DAYS,
  DEMO_REFERENCE_DATE,
  getApplication,
  getFitResponse,
  getSituacaoDeContratacao,
  getTalentJourney,
  reaproveitamentoDaCandidatura,
  type ReaproveitamentoDaCandidatura
} from '../state/selectors';
import type { DemoState } from '../types';
import {
  COMO_ESTA_SENDO_LABEL,
  JANELA_DO_MARCO_DIAS,
  MARCOS_DO_ACOMPANHAMENTO,
  type CheckIn,
  type MarcoDoAcompanhamento,
  type SituacaoDeContratacao
} from './acompanhamento';

/**
 * As sete situações possíveis, na ordem em que a jornada as encontra.
 *
 * `contratado` chegou por último e fecha o ciclo: até ele, a tela parava em
 * "a empresa quer conversar" e a pessoa nunca ficava sabendo, por aqui, que
 * tinha sido contratada.
 */
export type SituacaoId =
  | 'sem-resposta'
  | 'prazo-vencido'
  | 'em-analise'
  | 'enviado'
  | 'quer-conversar'
  | 'nao-seguiu'
  | 'contratado';

/**
 * O tom de cor da situação, no vocabulário de `metricas/cores.ts`.
 *
 * Declarado aqui como união de texto (e não importado dos componentes) para o
 * módulo de regra não depender da camada de interface. Cor nunca vem sozinha:
 * cada situação carrega o próprio título escrito.
 */
export type TomDaSituacao = 'combina' | 'atencao' | 'neutro' | 'empresa';

/** Um passo do "o que acontece agora": de quem é a vez e em quanto tempo. */
export type PassoDoAgora = {
  /** Quem age, em voz ativa. */
  quem: string;
  /** Em quanto tempo, ou o que limita o prazo. */
  quando: string;
};

export type AcaoDaSituacao = {
  rotulo: string;
  /**
   * Para onde o botão leva: o questionário da própria candidatura ou a
   * pergunta "como está sendo?" de quem foi contratado.
   */
  destino: 'questionario' | 'como-esta-sendo';
  /**
   * `discreta` quando a ação existe mas não deve empurrar: contar a própria
   * versão depois que a empresa informou saída é uma porta aberta, não uma
   * tarefa pendente. O padrão é `principal`.
   */
  peso?: 'principal' | 'discreta';
};

/**
 * A situação, enxuta: um título, uma linha, no máximo dois passos e, quando
 * a vez é da pessoa, um botão. O dono do produto pediu metade das palavras
 * (20/09/2026), e o público operacional lê no celular.
 *
 * O que saiu, de propósito: qualquer "responda de novo" ou "mude a resposta"
 * — a resposta é uma só e vale 12 meses; corrigir é pelo IEL —, e o caminho
 * de "procure o Centro de Empregos", que agora mora em "Seus dados".
 */
export type SituacaoDaCandidatura = {
  id: SituacaoId;
  tom: TomDaSituacao;
  /** O `h1` da tela: o estado dito em voz alta, sem rodeio. */
  titulo: string;
  /** Uma frase de contexto logo abaixo do título. */
  resumo: string;
  /** O que acontece agora. Um ou dois passos, nunca vazio. */
  agora: PassoDoAgora[];
  /** Ação principal, quando a vez é da pessoa. */
  acao: AcaoDaSituacao | null;
  /**
   * O que a pessoa já contou ao IEL depois de contratada, uma linha por
   * resposta ("Aos 30 dias, você disse que continua…"). Só em `contratado`.
   */
  contou?: string[];
};

/**
 * Dias entre duas datas curtas, contra a data de referência da base.
 *
 * Mesma regra de `getFitStatus`: a demonstração precisa ser idêntica hoje e
 * amanhã, então nada de relógio do navegador.
 */
function diasEntre(deIso: string, ateIso: string): number {
  const de = Date.parse(`${deIso.slice(0, 10)}T00:00:00.000Z`);
  const ate = Date.parse(`${ateIso.slice(0, 10)}T00:00:00.000Z`);
  if (Number.isNaN(de) || Number.isNaN(ate)) return 0;
  return Math.floor((ate - de) / 86_400_000);
}

/** O último dia de resposta do candidato: candidatura + 2 dias (R7). */
function limiteDoQuestionario(appliedAt: string): string {
  const base = Date.parse(`${appliedAt.slice(0, 10)}T00:00:00.000Z`);
  if (Number.isNaN(base)) return appliedAt;
  const limite = new Date(base + CANDIDATE_FIT_DEADLINE_DAYS * 86_400_000);
  return limite.toISOString().slice(0, 10);
}

/** Como a data aparece na frase: "16/09". */
function dataCurta(iso: string): string {
  const [, mes, dia] = iso.slice(0, 10).split('-');
  return mes && dia ? `${dia}/${mes}` : iso;
}

/**
 * A situação da candidatura, montada a partir do que o estado já sabe.
 *
 * A ordem das perguntas é a da jornada, e a decisão da empresa vence o resto:
 * quem recebeu um "quero entrevistar" não precisa ler que o currículo foi
 * enviado — ele já sabe.
 */
export function getSituacaoDaCandidatura(
  state: DemoState,
  applicationId: string
): SituacaoDaCandidatura | null {
  const application = getApplication(state, applicationId);
  if (!application) return null;

  /*
   * A contratação vence tudo. Ela só existe depois de um "quero entrevistar"
   * e do clique "contratei" da empresa (`company-outcome`), então quem tem
   * uma situação de contratação não precisa ler que a empresa quer conversar
   * — já conversou, e deu certo.
   */
  const contratacao = getSituacaoDeContratacao(state, applicationId);
  if (contratacao) return contratado(contratacao);

  /*
   * "Já respondeu" é ter todas as frases de que esta vaga precisa — daqui ou
   * de uma candidatura anterior dentro dos 12 meses — **e** ter confirmado
   * que elas valem aqui (`reuse-fit-answers`). Reaproveitar em silêncio
   * seria decidir por ela.
   */
  const reuso = reaproveitamentoDaCandidatura(state, applicationId);
  const confirmou = getFitResponse(state, applicationId) !== null;
  const faltam = reuso?.faltantes ?? 0;
  const respondeu = confirmou && faltam === 0;
  const limite = limiteDoQuestionario(application.appliedAt);

  // O desfecho vem da trajetória da pessoa, que já resolve "encaminhada",
  // "quis entrevistar" e "não avançou" a partir das remessas registradas.
  const desfecho =
    getTalentJourney(state, application.talentId).find(
      (entrada) => entrada.application.id === applicationId
    )?.outcome ?? 'em-analise';

  if (desfecho === 'nao-avancou') return naoSeguiu();
  if (desfecho === 'quero-entrevistar') return querConversar();
  if (desfecho === 'encaminhada') return enviado();
  if (respondeu) return emAnalise();

  // Nada a perguntar e ainda sem confirmação: a vez é dela, mas o que se
  // pede é um toque, não dez frases. Vale mesmo fora do prazo.
  if (!confirmou && reuso?.nadaAPerguntar) return somenteConfirmar(reuso);

  return diasEntre(application.appliedAt, DEMO_REFERENCE_DATE) >
    CANDIDATE_FIT_DEADLINE_DAYS
    ? prazoVencido(limite)
    : semResposta(limite, reuso);
}

/**
 * As respostas que a pessoa já deu cobrem esta vaga; falta ela confirmar.
 *
 * Usa a situação `sem-resposta` de propósito: para quem lê, a vez continua
 * sendo dela. O que muda é o tamanho do pedido — um toque, não dez frases.
 */
function somenteConfirmar(
  reuso: ReaproveitamentoDaCandidatura
): SituacaoDaCandidatura {
  const desde = reuso.desde ? ` em ${dataCurta(reuso.desde)}` : '';
  return {
    id: 'sem-resposta',
    tom: 'atencao',
    titulo: 'Falta você confirmar',
    resumo: `Você já respondeu estas ${reuso.perguntadas} frases${desde}. Só falta dizer que elas valem para esta vaga.`,
    agora: [
      {
        quem: 'Sua vez: confirme as suas respostas.',
        quando: 'Leva um toque.'
      },
      {
        quem: 'Depois, o IEL escolhe quais currículos envia à empresa.',
        quando: 'No máximo 5 por vaga.'
      }
    ],
    acao: { rotulo: 'Confirmar minhas respostas', destino: 'questionario' }
  };
}

function semResposta(
  limite: string,
  reuso: ReaproveitamentoDaCandidatura | null
): SituacaoDaCandidatura {
  const ultimoDia = limite.slice(0, 10) === DEMO_REFERENCE_DATE;
  // "Faltam 10 frases" era texto fixo, e passou a mentir no dia em que parte
  // das frases começou a vir de resposta anterior da própria pessoa.
  const faltam = reuso?.faltantes ?? 0;
  const frases = faltam === 1 ? '1 frase' : `${faltam} frases`;
  return {
    id: 'sem-resposta',
    tom: 'atencao',
    titulo: 'Falta você responder',
    resumo: `Faltam ${frases} sobre o seu jeito de trabalhar. Leva uns 5 minutos e não existe resposta certa.`,
    agora: [
      {
        quem: `Sua vez: responda ${frases}.`,
        quando: ultimoDia ? 'Hoje é o último dia.' : `Até ${dataCurta(limite)}.`
      },
      {
        quem: 'Depois, o IEL escolhe quais currículos envia à empresa.',
        quando: 'No máximo 5 por vaga.'
      }
    ],
    acao: { rotulo: 'Responder agora', destino: 'questionario' }
  };
}

function prazoVencido(limite: string): SituacaoDaCandidatura {
  return {
    id: 'prazo-vencido',
    tom: 'atencao',
    titulo: 'O prazo para responder terminou',
    resumo: `As frases desta vaga fecharam em ${dataCurta(limite)}. Você ainda pode responder, mas o IEL não garante que entre nesta vaga.`,
    agora: [
      {
        quem: 'Seu currículo continua no banco do IEL.',
        quando: 'Ele não sai por causa deste prazo.'
      },
      {
        quem: 'Quando aparecer outra vaga com o seu perfil, o IEL fala com você.',
        quando: 'Pelo mesmo telefone da sua candidatura.'
      }
    ],
    acao: { rotulo: 'Responder mesmo assim', destino: 'questionario' }
  };
}

function emAnalise(): SituacaoDaCandidatura {
  return {
    id: 'em-analise',
    tom: 'neutro',
    titulo: 'Suas respostas chegaram',
    resumo: 'Agora é com o IEL. Você não precisa fazer mais nada.',
    agora: [
      {
        quem: 'O IEL compara as suas respostas com o jeito da empresa.',
        quando: 'É a etapa de agora.'
      },
      {
        quem: 'Se o seu currículo for um dos enviados, esta página avisa.',
        quando: 'Em até 15 dias depois que a vaga abre.'
      }
    ],
    acao: null
  };
}

function enviado(): SituacaoDaCandidatura {
  return {
    id: 'enviado',
    tom: 'empresa',
    titulo: 'Seu currículo foi enviado à empresa',
    resumo: 'Você está entre os até 5 currículos que o IEL enviou.',
    agora: [
      {
        quem: 'A empresa lê os currículos e responde ao IEL.',
        quando: 'Costuma levar até 15 dias. Se atrasar, o IEL cobra.'
      },
      {
        // R5 de novo, e no ponto em que ela mais tenta escapar: é a pessoa do
        // IEL quem diz o nome da empresa, na ligação, nunca esta página.
        quem: 'Se ela quiser conversar, quem liga para você é a pessoa do IEL.',
        quando: 'É nessa ligação que você fica sabendo o nome da empresa.'
      }
    ],
    acao: null
  };
}

function querConversar(): SituacaoDaCandidatura {
  return {
    id: 'quer-conversar',
    tom: 'combina',
    titulo: 'A empresa quer conversar com você',
    resumo: 'A empresa leu o seu currículo e pediu uma entrevista.',
    agora: [
      {
        quem: 'A pessoa do IEL liga para você.',
        quando: 'Em até 2 dias, no telefone da sua candidatura.'
      },
      {
        quem: 'Na ligação você fica sabendo o nome da empresa, o endereço e o dia.',
        quando: 'Até lá, esta página não mostra o nome.'
      }
    ],
    acao: null
  };
}

/**
 * Quando a empresa não segue.
 *
 * O texto é o coração da tela, e cada frase tem um porquê:
 *
 * - **O sujeito é a vaga, não a pessoa.** "Esta vaga seguiu com outras
 *   pessoas" descreve o que aconteceu no processo. "Você foi reprovado"
 *   descreveria a pessoa — e a decisão da empresa não é sobre ela.
 * - **Nada de "reprovado", "descartado" ou "não qualificado".**
 * - **O tom é neutro, não vermelho.** Vermelho, na paleta, quer dizer
 *   "difere". Aqui não diferiu nada: uma empresa escolheu.
 * - **Nenhum motivo interno.** A justificativa da empresa é devolutiva dela
 *   para o IEL (§5.1); aqui ela nem é lida.
 * - **Sem falsa esperança.** Não se promete outra vaga nem prazo para ela.
 * - **As respostas continuam valendo, por 12 meses** (§5.6): numa vaga nova
 *   o IEL pergunta só o que faltar.
 */
function naoSeguiu(): SituacaoDaCandidatura {
  return {
    id: 'nao-seguiu',
    tom: 'neutro',
    titulo: 'Esta vaga seguiu com outras pessoas',
    resumo:
      'A empresa escolheu com quem conversar, e não foi desta vez. Não é uma avaliação sobre você.',
    agora: [
      {
        quem: 'Seu currículo continua no banco do IEL, e as suas respostas valem por 12 meses.',
        quando: 'Numa vaga nova, o IEL pergunta só o que faltar.'
      },
      {
        quem: 'Quando aparecer uma vaga com o seu perfil, o IEL fala com você.',
        quando: 'Pelo mesmo telefone da sua candidatura.'
      }
    ],
    acao: null
  };
}

/* ------------------------------------------------------------------ *
 * Contratado
 * ------------------------------------------------------------------ */

/** "1 dia", "45 dias". */
function dias(n: number): string {
  return n === 1 ? '1 dia' : `${n} dias`;
}

/**
 * O que a pessoa já contou, uma linha por resposta, na ordem dos marcos.
 *
 * É a resposta dela devolvida a ela: quem respondeu aos 30 dias e abre o
 * link aos 60 precisa ver que a resposta chegou e o que disse. "Como está
 * sendo" volta em palavra, do mesmo jeito que foi escolhida na tela — nunca
 * como o número de 1 a 5 que a base guarda.
 */
function linhasDoQueContou(checkIns: CheckIn[]): string[] {
  return checkIns.map((resposta) => {
    const como = COMO_ESTA_SENDO_LABEL[resposta.comoEstaSendo].toLowerCase();
    return resposta.continua
      ? `Aos ${resposta.marco} dias, você disse que continua na empresa e que está sendo ${como}.`
      : `Aos ${resposta.marco} dias, você disse que saiu da empresa e que estava sendo ${como}.`;
  });
}

/**
 * Quando a empresa contratou.
 *
 * Três textos para um id só, porque o que muda não é o estado da candidatura
 * — a pessoa foi contratada — e sim o que se sabe sobre a permanência e de
 * quem veio:
 *
 * - **A pessoa continua** (ou ninguém disse nada): os 90 dias e, se houver
 *   pergunta aberta, o botão para ela.
 * - **A pessoa contou que saiu**: vale a resposta dela. Sem culpa, o
 *   currículo continua, o IEL fala com ela.
 * - **A empresa informou saída e a pessoa não disse nada**: o mais delicado.
 *   A pessoa pode nem saber que a empresa avisou o IEL, e o motivo que a
 *   empresa deu é devolutiva dela (PRODUTO.md §5.1) — não passa por aqui.
 *   Neutro, sem motivo, com a porta aberta para ela contar a versão dela.
 *
 * Quando as duas fontes discordam e a pessoa disse que continua, a tela dela
 * mostra o que **ela** disse: a divergência é assunto da analista.
 */
function contratado(c: SituacaoDeContratacao): SituacaoDaCandidatura {
  const ultima = c.checkIns[c.checkIns.length - 1];
  if (ultima) return ultima.continua ? continuaNaEmpresa(c) : saiuPelaPessoa(c);
  if (c.porFonte.empresa === 'saiu') return saidaInformadaPelaEmpresa(c);
  return continuaNaEmpresa(c);
}

/**
 * O marco que a pessoa pode responder agora. `null` quando não há o que
 * contar (ainda não chegou aos 30 dias, as janelas fecharam sem resposta, ou
 * o marco alcançado já foi respondido — a resposta é uma só).
 *
 * Primeiro o pendente: alcançado, dentro da janela e sem resposta. Sem
 * pendente e sem resposta nenhuma, com a empresa dizendo que ela saiu, o
 * marco mais recente que ela alcançou: o seletor fecha as pendências quando a
 * empresa informa saída, mas a versão dela ainda não foi ouvida — e é a
 * versão dela que faz a divergência aparecer para a analista.
 *
 * Usado pela Minha candidatura (para decidir o botão) e pela tela da
 * pergunta (para saber o que abrir): uma regra só, lida nos dois lugares.
 */
export function marcoParaContar(
  c: SituacaoDeContratacao
): MarcoDoAcompanhamento | null {
  const pendente = c.pendentes[0];
  if (pendente !== undefined) return pendente;
  if (c.checkIns.length === 0 && c.porFonte.empresa === 'saiu') {
    const alcancados = MARCOS_DO_ACOMPANHAMENTO.filter(
      (marco) => c.diasNaEmpresa >= marco
    );
    return alcancados[alcancados.length - 1] ?? null;
  }
  return null;
}

/** O marco aberto e ainda sem resposta, se houver. Nunca há dois. */
function marcoAResponder(c: SituacaoDeContratacao) {
  return c.pendentes[0] ?? null;
}

/** Quantos dias a janela do marco aberto ainda fica aberta. */
function diasRestantesDaJanela(c: SituacaoDeContratacao): number {
  if (c.marcoAtual === null) return 0;
  return Math.max(1, c.marcoAtual + JANELA_DO_MARCO_DIAS - c.diasNaEmpresa);
}

function continuaNaEmpresa(c: SituacaoDeContratacao): SituacaoDaCandidatura {
  const aberto = marcoAResponder(c);
  const restam = diasRestantesDaJanela(c);
  const faltamParaOProximo =
    c.proximoMarco !== null ? c.proximoMarco - c.diasNaEmpresa : null;
  // "A primeira pergunta" só antes de qualquer marco ter chegado.
  const jaHouvePergunta = c.checkIns.length > 0 || c.perdidos.length > 0;

  // O segundo passo é o único que muda com o calendário: a vez é dela, a
  // próxima pergunta vem em N dias, ou as perguntas terminaram.
  const segundoPasso: PassoDoAgora = aberto
    ? {
        quem: `Sua vez: conte como está sendo aos ${aberto} dias.`,
        quando:
          restam === 1
            ? 'Hoje é o último dia. Leva 1 minuto.'
            : `Você tem ${dias(restam)}. Leva 1 minuto.`
      }
    : c.proximoMarco !== null && faltamParaOProximo !== null
      ? {
          quem: `${jaHouvePergunta ? 'A próxima' : 'A primeira'} pergunta é aos ${c.proximoMarco} dias.`,
          quando: `${faltamParaOProximo === 1 ? 'Falta 1 dia' : `Faltam ${faltamParaOProximo} dias`}, por este mesmo link.`
        }
      : {
          quem: 'Os 90 dias se completaram e as perguntas terminaram.',
          quando:
            c.checkIns.length > 0
              ? 'Obrigado por contar como foi.'
              : 'O IEL não vai perguntar mais nada por este link.'
        };

  return {
    id: 'contratado',
    tom: 'combina',
    titulo: 'Você foi contratado',
    resumo: `Parabéns! A empresa contratou você${c.diasNaEmpresa > 0 ? ` há ${dias(c.diasNaEmpresa)}` : ' hoje'}. Aos 30, 60 e 90 dias o IEL pergunta como está sendo — e a empresa não vê o que você responde.`,
    agora: [
      {
        quem: 'Não é uma avaliação sua. Quem lê é só a equipe do IEL.',
        quando: 'Por este mesmo link, 1 minuto por vez.'
      },
      segundoPasso
    ],
    acao: aberto
      ? { rotulo: 'Contar como está sendo', destino: 'como-esta-sendo' }
      : null,
    contou: linhasDoQueContou(c.checkIns)
  };
}

/**
 * A pessoa contou que saiu.
 *
 * O sujeito é o que ela contou, não um veredito sobre ela. Nada de "não deu
 * certo": saída antes de 90 dias é o dado que o IEL mais precisa para
 * calibrar a indicação, e a pessoa que o deu merece saber que ele serve
 * para isso — e que não vira nota no currículo dela (`AVISO_DEVOLUTIVA`).
 */
function saiuPelaPessoa(c: SituacaoDeContratacao): SituacaoDaCandidatura {
  return {
    id: 'contratado',
    tom: 'neutro',
    titulo: 'Você contou que saiu da empresa',
    resumo:
      'Obrigado por avisar. Sair antes dos 90 dias acontece, não é um erro seu e não vira nota no seu currículo.',
    agora: [
      {
        quem: 'Seu currículo continua no banco do IEL.',
        quando: 'Você não precisa se cadastrar outra vez.'
      },
      {
        quem: 'A pessoa do IEL fala com você sobre outras vagas.',
        quando:
          'Pelo mesmo telefone da sua candidatura. A empresa não vê o que você respondeu.'
      }
    ],
    acao: null,
    contou: linhasDoQueContou(c.checkIns)
  };
}

/**
 * A empresa informou saída antes dos 90 dias e a pessoa não disse nada.
 *
 * O que esta tela não faz: não repete o motivo que a empresa deu (é
 * devolutiva dela para o IEL, §5.1), não confirma nem contesta, e não trata
 * a informação como fato consumado — a pessoa pode não saber que a empresa
 * avisou, e pode ter outra versão. Diz o que o IEL sabe, de onde veio, e
 * deixa a porta aberta para ela contar.
 */
function saidaInformadaPelaEmpresa(
  c: SituacaoDeContratacao
): SituacaoDaCandidatura {
  // Só depois dos 30 dias há um marco em que ela possa contar a versão dela.
  const podeContar = marcoParaContar(c) !== null;
  return {
    id: 'contratado',
    tom: 'neutro',
    titulo: 'Você foi contratado nesta vaga',
    resumo: `A empresa contratou você em ${dataCurta(c.contratadoEm)} e informou ao IEL que você não continua lá. Se não estiver certo, ou se quiser contar como foi, a resposta é sua — e a empresa não vê.`,
    agora: [
      {
        quem: 'Seu currículo continua no banco do IEL.',
        quando: 'Nada disso vira avaliação sua.'
      },
      {
        quem: 'A pessoa do IEL fala com você sobre outras vagas.',
        quando: 'Pelo mesmo telefone da sua candidatura.'
      }
    ],
    acao: podeContar
      ? {
          rotulo: 'Contar como foi',
          destino: 'como-esta-sendo',
          peso: 'discreta'
        }
      : null,
    contou: linhasDoQueContou(c.checkIns)
  };
}
