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

/**
 * Posição da alternativa na escala do eixo. Sempre 1, 2 ou 3.
 *
 * É uma escala **ordinal**, não uma nota. A ordem expressa *quanto* de apoio,
 * de autonomia, de estrutura ou de previsibilidade a alternativa descreve —
 * nunca "melhor" ou "pior". Uma empresa em que cada um assume a rotina por
 * conta (1 em apoio inicial) não é pior do que uma com acompanhamento
 * definido (3): é outra condição de trabalho, e a pessoa que combina com ela
 * é outra.
 *
 * O valor existe por uma razão só: sem uma escala comum aos dois lados não há
 * distância a medir, e sem distância não há percentual de aderência — que é a
 * regra de negócio do cliente (R3, M4). Todo eixo usa a mesma amplitude
 * (mínimo 1, máximo 3) para que um eixo não pese mais que outro por acidente
 * de escala; o que pondera é o peso declarado pela empresa.
 */
export type CultureOptionValue = 1 | 2 | 3;

export const CULTURE_SCALE_MIN: CultureOptionValue = 1;
export const CULTURE_SCALE_MAX: CultureOptionValue = 3;

export type CultureOption = {
  id: CultureOptionId;
  /** Texto da alternativa, em termos de prática observável. */
  label: string;
  /** Posição ordinal no eixo. Ver `CultureOptionValue`. */
  value: CultureOptionValue;
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
    // Escala: quanto de apoio estruturado existe no início. 1 = nenhum.
    options: [
      {
        id: 'acompanhamento-formal',
        label: 'Há acompanhamento definido nas primeiras semanas',
        value: 3
      },
      {
        id: 'troca-informal',
        label: 'Há troca informal com colegas, sem acompanhamento definido',
        value: 2
      },
      {
        id: 'por-conta',
        label: 'A pessoa assume a rotina por conta desde o início',
        value: 1
      }
    ]
  },
  {
    axisId: 'autonomia',
    prompt: 'Quanto da rotina do dia é decidido por quem executa?',
    // Escala: quanto de autonomia tem quem executa. 1 = nenhuma.
    options: [
      {
        id: 'rotina-definida',
        label: 'A rotina chega definida por outra pessoa',
        value: 1
      },
      {
        id: 'parcial',
        label: 'Parte é definida, parte a pessoa organiza',
        value: 2
      },
      {
        id: 'autonomia-ampla',
        label: 'Quem executa organiza o próprio trabalho',
        value: 3
      }
    ]
  },
  {
    axisId: 'comunicacao-prioridades',
    prompt: 'Como as prioridades do dia chegam até a equipe?',
    // Escala: quanto de estrutura tem a comunicação. 1 = nenhuma, o combinado
    // vai surgindo no meio do turno.
    options: [
      {
        id: 'por-escrito',
        label: 'Por escrito, em checklist ou sistema',
        value: 3
      },
      {
        id: 'verbal-inicio',
        label: 'Verbalmente, no início do turno',
        value: 2
      },
      {
        id: 'ao-longo-do-dia',
        label: 'Ao longo do dia, conforme surgem',
        value: 1
      }
    ]
  },
  {
    axisId: 'ritmo-turno',
    prompt: 'O horário praticado varia ao longo da semana?',
    // Escala: quanto de previsibilidade tem o horário. 1 = nenhuma.
    options: [
      { id: 'fixo', label: 'Horário fixo, sem variação', value: 3 },
      {
        id: 'variacao-prevista',
        label: 'Varia, mas com escala combinada com antecedência',
        value: 2
      },
      {
        id: 'variacao-frequente',
        label: 'Varia conforme a demanda, com pouca antecedência',
        value: 1
      }
    ]
  },
  {
    axisId: 'aprendizado',
    prompt: 'O que a empresa espera que a pessoa aprenda nos primeiros meses?',
    // Escala: quanto de aprendizado a função comporta no início. 1 = nenhum,
    // espera-se domínio na entrada.
    options: [
      {
        id: 'rotina-propria',
        label: 'A rotina específica da função',
        value: 2
      },
      {
        id: 'processos-amplos',
        label: 'A rotina e os processos das áreas vizinhas',
        value: 3
      },
      {
        id: 'ja-domina',
        label: 'Espera-se que já domine a rotina ao entrar',
        value: 1
      }
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

/**
 * Posição ordinal de uma alternativa no eixo.
 *
 * Devolve `null` quando a alternativa não existe mais no questionário — trocar
 * um eixo é mudar o parâmetro do produto, e uma resposta antiga órfã não pode
 * virar um número inventado no meio do cálculo de aderência.
 */
export function getCultureOptionValue(
  axisId: FitAxisId,
  optionId: CultureOptionId
): CultureOptionValue | null {
  const question = getCultureQuestion(axisId);
  return (
    question?.options.find((option) => option.id === optionId)?.value ?? null
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
