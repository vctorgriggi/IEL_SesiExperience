/**
 * Traçado cultural da empresa.
 *
 * Três restrições moldam este desenho, e nenhuma delas é opcional.
 *
 * **Não pode ser um formulário longo.** O enunciado lista como limitações do
 * fit cultural o custo alto e o tempo elevado de aplicação. Pedir que a
 * empresa preencha uma bateria de perguntas recria o problema que o desafio
 * quer remover. Por isso a análise assistida lê o que a empresa já escreveu —
 * descrição da vaga, rotina da equipe, respostas do gestor — e **propõe** o
 * traçado com o trecho que a sustenta. A empresa confirma ou corrige, num
 * clique por eixo.
 *
 * **Não pode ser uma pessoa só.** Se apenas a gestão responde, o traçado vira
 * autorretrato: no papel todo mundo colabora, na prática cada um resolve o
 * seu. O enunciado exige redução de vieses. Então cada eixo admite respostas
 * de papéis diferentes — gestão, RH e a própria equipe — e a leitura mostra
 * quando elas não coincidem, em vez de escolher uma versão.
 *
 * **A decisão continua humana.** O enunciado exige supervisão humana e diz
 * que recomendações devem apoiar, não substituir. A proposta da análise nunca
 * vira resposta sozinha: fica pendente até alguém confirmar, e o trecho de
 * origem fica visível para que a confirmação seja informada.
 *
 * As respostas da equipe são agregadas e anônimas: a LGPD está nas exigências
 * do desafio, e quem responde sobre o próprio ambiente de trabalho não pode
 * ficar identificado para a gestão.
 */

import type { FitAxisId } from './fit-axes';

export type CultureOptionId = string;

export type CultureOption = {
  id: CultureOptionId;
  /** Texto da alternativa, em termos de prática observável. */
  label: string;
};

export type CultureQuestion = {
  axisId: FitAxisId;
  /** Pergunta feita a quem responde sobre a própria empresa. */
  prompt: string;
  options: CultureOption[];
};

/**
 * O questionário. É o parâmetro do produto: trocar ou acrescentar eixos aqui
 * muda o traçado das duas pontas sem tocar nas telas.
 *
 * As alternativas descrevem prática de trabalho, nunca traço de pessoa. O
 * enunciado veda dado de saúde na seleção e manda tratar bem-estar pela
 * perspectiva do ambiente e das relações de trabalho.
 */
export const CULTURE_QUESTIONS: CultureQuestion[] = [
  {
    axisId: 'apoio-inicial',
    prompt: 'Como alguém que entra hoje aprende a rotina?',
    options: [
      {
        id: 'acompanhamento-formal',
        label: 'Há acompanhamento definido nas primeiras semanas'
      },
      {
        id: 'troca-informal',
        label: 'Há troca informal com colegas, sem acompanhamento definido'
      },
      {
        id: 'por-conta',
        label: 'A pessoa assume a rotina por conta desde o início'
      }
    ]
  },
  {
    axisId: 'autonomia',
    prompt: 'Quanto da rotina do dia é decidido por quem executa?',
    options: [
      {
        id: 'rotina-definida',
        label: 'A rotina chega definida por outra pessoa'
      },
      { id: 'parcial', label: 'Parte é definida, parte a pessoa organiza' },
      {
        id: 'autonomia-ampla',
        label: 'Quem executa organiza o próprio trabalho'
      }
    ]
  },
  {
    axisId: 'comunicacao-prioridades',
    prompt: 'Como as prioridades do dia chegam até a equipe?',
    options: [
      { id: 'por-escrito', label: 'Por escrito, em checklist ou sistema' },
      { id: 'verbal-inicio', label: 'Verbalmente, no início do turno' },
      { id: 'ao-longo-do-dia', label: 'Ao longo do dia, conforme surgem' }
    ]
  },
  {
    axisId: 'ritmo-turno',
    prompt: 'O horário praticado varia ao longo da semana?',
    options: [
      { id: 'fixo', label: 'Horário fixo, sem variação' },
      {
        id: 'variacao-prevista',
        label: 'Varia, mas com escala combinada com antecedência'
      },
      {
        id: 'variacao-frequente',
        label: 'Varia conforme a demanda, com pouca antecedência'
      }
    ]
  },
  {
    axisId: 'aprendizado',
    prompt: 'O que a empresa espera que a pessoa aprenda nos primeiros meses?',
    options: [
      { id: 'rotina-propria', label: 'A rotina específica da função' },
      {
        id: 'processos-amplos',
        label: 'A rotina e os processos das áreas vizinhas'
      },
      { id: 'ja-domina', label: 'Espera-se que já domine a rotina ao entrar' }
    ]
  }
];

export function getCultureQuestion(axisId: FitAxisId): CultureQuestion | null {
  return (
    CULTURE_QUESTIONS.find((question) => question.axisId === axisId) ?? null
  );
}

export function getCultureOptionLabel(
  axisId: FitAxisId,
  optionId: CultureOptionId
): string {
  const question = getCultureQuestion(axisId);
  return (
    question?.options.find((option) => option.id === optionId)?.label ??
    optionId
  );
}

/** Quem respondeu. A equipe entra agregada e sem identificação. */
export type CultureRespondent = 'gestao' | 'rh' | 'equipe';

export const CULTURE_RESPONDENT_LABEL: Record<CultureRespondent, string> = {
  gestao: 'Gestão da área',
  rh: 'RH da empresa',
  equipe: 'Equipe'
};

/**
 * Quantas respostas da equipe sustentam uma leitura.
 *
 * Abaixo disso a tela diz que a consulta ainda não tem base suficiente, em
 * vez de tratar duas respostas como "a equipe".
 */
export const MIN_TEAM_RESPONSES = 3;
