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
 * - **Percentual.** A aderência dele é dado dele (§5.1, "a própria, por eixo,
 *   sem nome da empresa"), mas o que volta é palavra: em que temas combinou e
 *   em quais ficou diferente. Um número sem contexto, numa tela sobre a
 *   própria vida, vira nota — e isto não é nota.
 *
 * ## Vocabulário
 *
 * "Encaminhamento" vira **currículo enviado**, "aderência" vira **combina com
 * a empresa**, "eixo" vira **tema**: o glossário de `copy.ts` e da seção 3 do
 * documento de design. Frases curtas, voz ativa, uma ideia por frase — o
 * público é operacional e trava em plataforma (00:08:01).
 */

import { COPY } from '../copy';
import {
  CANDIDATE_FIT_DEADLINE_DAYS,
  DEMO_REFERENCE_DATE,
  getAdherence,
  getApplication,
  getFitResponse,
  getTalentJourney,
  reaproveitamentoDaCandidatura,
  type ReaproveitamentoDaCandidatura
} from '../state/selectors';
import type { DemoState } from '../types';

/** As seis situações possíveis, na ordem em que a jornada as encontra. */
export type SituacaoId =
  | 'sem-resposta'
  | 'prazo-vencido'
  | 'em-analise'
  | 'enviado'
  | 'quer-conversar'
  | 'nao-seguiu';

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
  /** Único destino possível hoje: o questionário da própria candidatura. */
  destino: 'questionario';
};

export type SituacaoDaCandidatura = {
  id: SituacaoId;
  tom: TomDaSituacao;
  /** O `h1` da tela: o estado dito em voz alta, sem rodeio. */
  titulo: string;
  /** Uma frase de contexto logo abaixo do título. */
  resumo: string;
  /** O que acontece agora. Nunca vazio — silêncio é o defeito que se corrige. */
  agora: PassoDoAgora[];
  /** O caminho concreto de seguir, quando ele existe. */
  caminho: string | null;
  /** Ação principal, quando a vez é da pessoa. */
  acao: AcaoDaSituacao | null;
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
   * Desde que a resposta passou a ser da pessoa e a valer 12 meses, "já
   * respondeu" deixou de ser "existe um registro desta candidatura". O que
   * decide é se esta vaga tem todas as frases de que precisa — vindas daqui
   * ou de uma candidatura anterior dentro da validade — **e** se a pessoa
   * confirmou que elas valem aqui. Reaproveitar em silêncio seria decidir
   * por ela, então a confirmação é um passo dela, com registro próprio
   * (`reuse-fit-answers`).
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
  // pede não é responder — é dizer que as respostas dela valem aqui. Vale
  // mesmo fora do prazo: confirmar leva um toque.
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
  const desde = reuso.desde ? dataCurta(reuso.desde) : null;
  return {
    id: 'sem-resposta',
    tom: 'atencao',
    titulo: 'Falta você confirmar',
    resumo: desde
      ? `Você já respondeu estas ${reuso.perguntadas} frases em ${desde}, e elas continuam valendo. Para esta vaga, o IEL não precisa perguntar nada de novo — só que você diga que pode usar as suas respostas.`
      : `Você já respondeu estas ${reuso.perguntadas} frases antes, e elas continuam valendo. Para esta vaga, o IEL só precisa que você diga que pode usá-las.`,
    agora: [
      {
        quem: 'Agora é a sua vez: confirme que as suas respostas valem para esta vaga.',
        quando: 'Leva um toque. Nenhuma frase nova é perguntada.'
      },
      {
        quem: 'Depois, o IEL analisa e escolhe quais currículos envia à empresa.',
        quando: 'São no máximo 5 currículos por vaga.'
      }
    ],
    caminho:
      'Se preferir, você pode responder tudo de novo — vale sempre a sua última resposta.',
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
  const jaVieram =
    reuso && reuso.reaproveitadas > 0 && reuso.desde
      ? ` ${reuso.reaproveitadas} de ${reuso.perguntadas} já vieram das suas respostas de ${dataCurta(reuso.desde)}.`
      : '';
  return {
    id: 'sem-resposta',
    tom: 'atencao',
    titulo: 'Falta você responder',
    resumo: `Você se candidatou a esta vaga. Para o IEL comparar o seu jeito de trabalhar com o da empresa, faltam ${frases}.${jaVieram} Leva poucos minutos e não existe resposta certa.`,
    agora: [
      {
        quem: `Agora é a sua vez: responda ${frases}.`,
        quando: ultimoDia
          ? 'Hoje é o último dia para responder.'
          : `Você tem até ${dataCurta(limite)} para responder.`
      },
      {
        quem: 'Depois, o IEL analisa e escolhe quais currículos envia à empresa.',
        quando: 'São no máximo 5 currículos por vaga.'
      }
    ],
    caminho:
      'Se você não conseguir responder pelo celular, fale com a pessoa do IEL que mandou este link. Ela responde junto com você por telefone.',
    acao: { rotulo: 'Responder agora', destino: 'questionario' }
  };
}

function prazoVencido(limite: string): SituacaoDaCandidatura {
  return {
    id: 'prazo-vencido',
    tom: 'atencao',
    titulo: 'O prazo para responder terminou',
    resumo: `O questionário desta vaga ficava aberto por dois dias e fechou em ${dataCurta(limite)}. Sem as suas respostas, o IEL não tem como comparar o seu jeito de trabalhar com o da empresa desta vaga.`,
    agora: [
      {
        quem: 'Seu currículo continua no banco de talentos do IEL.',
        quando: 'Ele não sai por causa deste prazo.'
      },
      {
        quem: 'Quando aparecer outra vaga com o seu perfil, o IEL fala com você.',
        quando: 'Pelo mesmo telefone da sua candidatura.'
      }
    ],
    caminho:
      'Você ainda pode responder. Fora do prazo, o IEL não garante que as respostas entrem nesta vaga.',
    acao: { rotulo: 'Responder mesmo assim', destino: 'questionario' }
  };
}

function emAnalise(): SituacaoDaCandidatura {
  return {
    id: 'em-analise',
    tom: 'neutro',
    titulo: 'Suas respostas chegaram',
    resumo:
      'Agora o IEL analisa quem envia para esta vaga. Você não precisa fazer mais nada por enquanto.',
    agora: [
      {
        quem: 'O IEL compara as suas respostas com o jeito de trabalhar da equipe da empresa.',
        quando: 'É a etapa de agora.'
      },
      {
        quem: 'Se o seu currículo for um dos enviados, esta página avisa.',
        quando:
          'A primeira leva de currículos sai em até 15 dias depois que a vaga abre.'
      }
    ],
    caminho:
      'Mudou de ideia sobre alguma resposta? Responda de novo: fica valendo a última.',
    acao: { rotulo: 'Mudar minhas respostas', destino: 'questionario' }
  };
}

function enviado(): SituacaoDaCandidatura {
  return {
    id: 'enviado',
    tom: 'empresa',
    titulo: 'Seu currículo foi enviado à empresa',
    resumo:
      'Você está entre os até 5 currículos que o IEL enviou para esta vaga.',
    agora: [
      {
        quem: 'Agora a empresa lê os currículos e responde ao IEL.',
        quando: 'A empresa costuma responder em até 15 dias.'
      },
      {
        // R5 de novo, e no ponto em que ela mais tenta escapar: é a pessoa do
        // IEL quem diz o nome da empresa, na ligação, nunca esta página.
        quem: 'Se ela quiser conversar, quem liga para você é a pessoa do IEL.',
        quando: 'É nessa ligação que você fica sabendo o nome da empresa.'
      }
    ],
    caminho:
      'Se a empresa não responder no prazo, o IEL cobra. Você não precisa ligar para ninguém.',
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
        quem: 'A pessoa do IEL liga para você, no telefone da sua candidatura.',
        quando: 'O contato costuma sair em até 2 dias.'
      },
      {
        quem: 'Nessa ligação você fica sabendo o nome da empresa, o endereço e o dia da entrevista.',
        quando: 'Até lá, nem o IEL nem esta página mostram o nome.'
      }
    ],
    caminho:
      'Se ninguém falar com você em 2 dias, procure o Centro de Empregos do IEL pelo mesmo contato que mandou este link.',
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
 * - **Nada de "reprovado", "descartado" ou "não qualificado".** Palavra de
 *   processo seletivo que a pessoa leva para casa como veredito.
 * - **O tom é neutro, não vermelho.** Vermelho, na paleta do produto, quer
 *   dizer "difere". Aqui não diferiu nada: uma empresa escolheu.
 * - **Nenhum motivo interno.** A justificativa que a empresa registra é
 *   devolutiva dela para o IEL (§5.1); repeti-la aqui seria abrir análise
 *   interna para quem ela avalia.
 * - **Sem falsa esperança.** Não se promete outra vaga nem prazo para ela.
 *   Diz-se o que é verdade: o currículo fica, e o IEL procura.
 * - **As respostas continuam valendo, por 12 meses.** É o que o aceite
 *   promete (`CANDIDATE_CONSENT_TEXT.retention`) e o que §5.6 determina desde
 *   que a resposta passou a ser da pessoa: numa vaga nova o IEL usa o que ela
 *   já respondeu e pergunta só o que faltar. Dizer aqui que ela terá de
 *   responder tudo de novo seria desmentir o aceite — e prometer mais do que
 *   isso, como uma próxima vaga, seria consolo à custa da verdade.
 */
function naoSeguiu(): SituacaoDaCandidatura {
  return {
    id: 'nao-seguiu',
    tom: 'neutro',
    titulo: 'Esta vaga seguiu com outras pessoas',
    resumo:
      'A empresa decidiu com quem quer conversar, e não foi desta vez. É uma decisão da empresa sobre esta vaga: não é uma avaliação sobre você e não muda o seu currículo.',
    agora: [
      {
        quem: 'Seu currículo continua no banco de talentos do IEL.',
        quando:
          'Você segue concorrendo a outras vagas, sem se cadastrar de novo.'
      },
      {
        quem: 'Quando aparecer uma vaga com o seu perfil, o IEL fala com você.',
        quando: 'Pelo mesmo telefone da sua candidatura.'
      }
    ],
    caminho:
      'As respostas que você deu continuam valendo por 12 meses. Numa vaga nova o IEL usa o que você já respondeu e pergunta só o que faltar — cada empresa escolhe algumas frases, e nem sempre são as mesmas. Para falar com alguém agora, procure o Centro de Empregos do IEL pelo mesmo contato que mandou este link.',
    acao: null
  };
}

/**
 * Os temas em que a pessoa combinou com a empresa e aqueles em que ficou
 * diferente — em palavra, nunca em percentual.
 *
 * É a aderência dela, que §5.1 permite mostrar "a própria, por eixo, sem nome
 * da empresa". O corte de 60 é o mesmo de `textoDaAderencia`, a faixa em que
 * o produto já diz "combina" em todas as outras telas: dois limiares
 * diferentes para a mesma ideia fariam a pessoa ler uma coisa aqui e o
 * analista, outra lá.
 *
 * Temas sem os dois lados ficam de fora em silêncio. Falta de dado não é
 * defeito da pessoa, e listá-los encheria a tela com uma ausência que ela não
 * pode resolver.
 */
export const LIMITE_DE_COMBINA = 60;

export type TemasDoCandidato = {
  combinou: string[];
  diferente: string[];
};

export function getTemasDoCandidato(
  state: DemoState,
  applicationId: string
): TemasDoCandidato | null {
  if (!getFitResponse(state, applicationId)) return null;

  const aderencia = getAdherence(state, applicationId);
  if (!aderencia) return null;

  const combinou: string[] = [];
  const diferente: string[] = [];

  for (const tema of aderencia.byAxis) {
    if (tema.adherence === null) continue;
    const rotulo = COPY.axis(tema.axisId);
    if (tema.adherence >= LIMITE_DE_COMBINA) combinou.push(rotulo);
    else diferente.push(rotulo);
  }

  if (combinou.length === 0 && diferente.length === 0) return null;
  return { combinou, diferente };
}
