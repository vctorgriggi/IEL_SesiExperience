/**
 * Questionário de fit do candidato (M3, R4).
 *
 * É o lado que faltava. O traçado da empresa já existia em
 * `analysis/culture.ts`; sem o mesmo traçado do lado da pessoa não há
 * distância a medir, e o percentual de aderência que o cliente pediu (R3,
 * 00:20:19) não teria de onde sair.
 *
 * Três decisões moldam o que está aqui, e nenhuma é estética.
 *
 * **Par de situação, não escala abstrata.** O cliente validou o formato na
 * reunião — "autonomia ou processos claros" — e o público é operacional, com
 * baixo letramento digital (00:08:01). Cada pergunta descreve duas situações
 * de um dia de trabalho e pede qual se parece mais com o que a pessoa
 * procura. Nada de "de 1 a 5, quanto você concorda".
 *
 * **As mesmas alternativas da empresa, na voz da pessoa.** Cada alternativa
 * aqui carrega o mesmo `optionId` e o mesmo `value` ordinal (1..3) da
 * alternativa correspondente do questionário da empresa. É o que torna a
 * comparação legítima: os dois lados respondem a mesma escala, e a aderência
 * é a distância entre duas respostas à mesma pergunta — não a correlação
 * entre dois instrumentos diferentes.
 *
 * **Não é teste de personalidade.** O briefing veda instrumento psicométrico
 * e o MoSCoW põe "perfil comportamental completo" nos Won't. O que se
 * pergunta aqui é preferência de condição de trabalho: apoio, autonomia,
 * comunicação, horário e aprendizado. Nenhuma pergunta sobre personalidade,
 * saúde (inclusive saúde mental), família, religião, opinião política,
 * filiação sindical ou qualquer outra categoria do art. 5º, II, da LGPD.
 *
 * ## Base legal e minimização
 *
 * A base legal do tratamento é o **consentimento do titular** — LGPD, art.
 * 7º: "O tratamento de dados pessoais somente poderá ser realizado nas
 * seguintes hipóteses: I - mediante o fornecimento de consentimento pelo
 * titular". O aceite é registrado junto da resposta (ver
 * `CandidateFitResponse.consent`) com a versão do texto aceito, porque sem
 * versão não há como demonstrar *a que* a pessoa consentiu — LGPD, art. 6º:
 * "X - responsabilização e prestação de contas: demonstração, pelo agente, da
 * adoção de medidas eficazes e capazes de comprovar a observância e o
 * cumprimento das normas de proteção de dados pessoais".
 *
 * A finalidade é uma só e cabe numa frase: comparar a preferência declarada
 * pela pessoa com o perfil da empresa naquela vaga, para o analista decidir
 * quais currículos encaminhar. LGPD, art. 6º: "I - finalidade: realização do
 * tratamento para propósitos legítimos, específicos, explícitos e informados
 * ao titular, sem possibilidade de tratamento posterior de forma incompatível
 * com essas finalidades".
 *
 * A coleta é o mínimo que essa finalidade exige: cinco respostas de três
 * alternativas, vinculadas à candidatura. Nenhum texto livre, nenhum dado de
 * contato novo, nenhuma pergunta que não entre no cálculo. LGPD, art. 6º:
 * "III - necessidade: limitação do tratamento ao mínimo necessário para a
 * realização de suas finalidades, com abrangência dos dados pertinentes,
 * proporcionais e não excessivos em relação às finalidades do tratamento de
 * dados". É por isso que o questionário tem exatamente cinco perguntas: uma
 * por eixo que o motor de aderência usa. Um eixo a mais seria dado coletado
 * sem uso.
 *
 * O resultado alimenta uma decisão sobre a pessoa, então ele precisa ser
 * explicável até o eixo — LGPD, art. 20, § 1º: "O controlador deverá fornecer,
 * sempre que solicitadas, informações claras e adequadas a respeito dos
 * critérios e dos procedimentos utilizados para a decisão automatizada". Daí
 * `computeAdherence` devolver a conta aberta por eixo, e não só o total.
 */

import {
  getCultureQuestion,
  type CultureOptionId,
  type CultureOptionValue
} from './culture';
import { FIT_AXES, type FitAxisId } from './fit-axes';

/** Versão do texto de aceite apresentado ao candidato (M7). */
/*
 * 2026-09-20: "percentual de aderência por eixo" virou linguagem de gente
 * ("quanto você combina com a empresa em cada ponto"). O sentido não mudou,
 * mas o texto que a pessoa aceitou mudou, então a versão sobe.
 */
export const CANDIDATE_CONSENT_VERSION = '2026-09-20';

/**
 * O texto que abre o questionário, antes da primeira pergunta.
 *
 * Cobre o que o art. 9º da LGPD manda informar de forma "clara, adequada e
 * ostensiva": finalidade específica, forma e duração, quem é o controlador,
 * com quem o dado é compartilhado e quais são os direitos do titular. Sem o
 * aceite o questionário não abre (seção 5.3 do documento de produto).
 */
export const CANDIDATE_CONSENT_TEXT = {
  version: CANDIDATE_CONSENT_VERSION,
  title: 'Antes de começar',
  purpose:
    'São 5 perguntas sobre como você prefere trabalhar. As respostas são usadas só para comparar o que você procura com o jeito de trabalhar da empresa desta vaga.',
  collected:
    'Coletamos apenas a alternativa escolhida em cada uma das 5 perguntas. Nada de saúde, família, religião, opinião política ou teste de personalidade.',
  whoSees:
    'Quem vê: a equipe do IEL que cuida desta vaga. Se o seu currículo for encaminhado, a empresa vê quanto você combina com ela em cada ponto — nunca as suas respostas uma a uma.',
  retention:
    'As respostas ficam ligadas a esta candidatura e deixam de ser usadas quando a vaga se encerra.',
  rights:
    'Você pode ver o que está registrado sobre você, pedir correção e retirar o consentimento pelo mesmo canal.'
} as const;

export type CandidateFitOption = {
  /** Mesmo id da alternativa correspondente do lado da empresa. */
  id: CultureOptionId;
  /** A alternativa escrita na voz de quem procura trabalho. */
  label: string;
  /** Mesma posição ordinal da alternativa da empresa. */
  value: CultureOptionValue;
};

export type CandidateFitQuestion = {
  axisId: FitAxisId;
  /** O par de situação, em linguagem do dia a dia de trabalho. */
  prompt: string;
  /** Uma linha de contexto, para a pergunta não ficar solta. */
  hint: string;
  options: CandidateFitOption[];
};

/**
 * As cinco perguntas, na ordem em que aparecem no celular.
 *
 * Os `label` foram reescritos na primeira pessoa; os `id` e os `value` são os
 * mesmos do questionário da empresa de propósito — ver o cabeçalho deste
 * arquivo. `assertCandidateQuestionnaireMirrorsCompany` guarda essa promessa.
 */
export const CANDIDATE_FIT_QUESTIONS: CandidateFitQuestion[] = [
  {
    axisId: 'apoio-inicial',
    prompt: 'No seu primeiro mês, o que você procura?',
    hint: 'Não existe resposta certa: empresas funcionam de jeitos diferentes.',
    options: [
      {
        id: 'acompanhamento-formal',
        label: 'Alguém acompanhando meu trabalho nas primeiras semanas',
        value: 3
      },
      {
        id: 'troca-informal',
        label: 'Poder perguntar aos colegas quando eu tiver dúvida',
        value: 2
      },
      {
        id: 'por-conta',
        label: 'Pegar a rotina por conta própria desde o começo',
        value: 1
      }
    ]
  },
  {
    axisId: 'autonomia',
    prompt: 'Como você prefere que seu dia seja organizado?',
    hint: 'Pense na rotina que você teve nos últimos trabalhos.',
    options: [
      {
        id: 'rotina-definida',
        label: 'Receber a rotina pronta de alguém e seguir',
        value: 1
      },
      {
        id: 'parcial',
        label: 'Uma parte combinada com a chefia, outra parte eu organizo',
        value: 2
      },
      {
        id: 'autonomia-ampla',
        label: 'Organizar sozinho o meu trabalho no turno',
        value: 3
      }
    ]
  },
  {
    axisId: 'comunicacao-prioridades',
    prompt: 'Como você prefere saber o que é prioridade no dia?',
    hint: 'É sobre a forma de combinar, não sobre quem manda.',
    options: [
      {
        id: 'por-escrito',
        label: 'Por escrito, numa lista ou no sistema',
        value: 3
      },
      {
        id: 'verbal-inicio',
        label: 'Conversando no começo do turno',
        value: 2
      },
      {
        id: 'ao-longo-do-dia',
        label: 'Ao longo do dia, conforme as coisas aparecem',
        value: 1
      }
    ]
  },
  {
    axisId: 'ritmo-turno',
    prompt: 'Sobre o horário, o que funciona melhor para você?',
    hint: 'Pense no que dá para combinar com a sua vida fora do trabalho.',
    options: [
      { id: 'fixo', label: 'Horário sempre igual, sem mudar', value: 3 },
      {
        id: 'variacao-prevista',
        label: 'Pode mudar, desde que eu saiba com antecedência',
        value: 2
      },
      {
        id: 'variacao-frequente',
        label: 'Consigo me virar mesmo quando muda de última hora',
        value: 1
      }
    ]
  },
  {
    axisId: 'aprendizado',
    prompt: 'O que você espera aprender nesta oportunidade?',
    hint: 'Serve para saber se a vaga tem o que você procura.',
    options: [
      {
        id: 'rotina-propria',
        label: 'Aprender bem a rotina da minha função',
        value: 2
      },
      {
        id: 'processos-amplos',
        label: 'Aprender também como funcionam as áreas vizinhas',
        value: 3
      },
      {
        id: 'ja-domina',
        label: 'Já sei fazer esse trabalho e quero começar direto',
        value: 1
      }
    ]
  }
];

export function getCandidateFitQuestion(
  axisId: FitAxisId
): CandidateFitQuestion | null {
  return (
    CANDIDATE_FIT_QUESTIONS.find((question) => question.axisId === axisId) ??
    null
  );
}

export function getCandidateFitOptionLabel(
  axisId: FitAxisId,
  value: CultureOptionValue
): string {
  const question = getCandidateFitQuestion(axisId);
  return (
    question?.options.find((option) => option.value === value)?.label ??
    String(value)
  );
}

/**
 * As duas pontas respondem a mesma escala?
 *
 * Um eixo acrescentado só de um lado, ou uma alternativa com `value`
 * diferente entre empresa e candidato, produziria um percentual de aderência
 * que parece certo e não é. Como isso não aparece em nenhuma tela, a garantia
 * fica aqui, executável, e o teste a chama.
 */
export function assertCandidateQuestionnaireMirrorsCompany(): string[] {
  const problems: string[] = [];

  for (const axis of FIT_AXES) {
    const candidate = getCandidateFitQuestion(axis.id);
    const company = getCultureQuestion(axis.id);

    if (!candidate || !company) {
      problems.push(`Eixo ${axis.id} não tem os dois lados do questionário.`);
      continue;
    }

    for (const option of company.options) {
      const mirror = candidate.options.find((entry) => entry.id === option.id);
      if (!mirror) {
        problems.push(
          `Eixo ${axis.id}: a alternativa "${option.id}" existe para a empresa e não para o candidato.`
        );
        continue;
      }
      if (mirror.value !== option.value) {
        problems.push(
          `Eixo ${axis.id}: a alternativa "${option.id}" vale ${option.value} para a empresa e ${mirror.value} para o candidato.`
        );
      }
    }

    for (const option of candidate.options) {
      if (!company.options.some((entry) => entry.id === option.id)) {
        problems.push(
          `Eixo ${axis.id}: a alternativa "${option.id}" existe para o candidato e não para a empresa.`
        );
      }
    }
  }

  return problems;
}
