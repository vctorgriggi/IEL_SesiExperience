import type { CultureAnswer } from '../types';

/**
 * Respostas registradas sobre a cultura das empresas da base demo.
 *
 * A distribuição é desenhada para mostrar o que uma fonte única esconderia.
 * Na Cerrado Distribuição, a gestão responde que há troca informal no apoio a
 * quem entra; a equipe, consultada de forma agregada e anônima, responde em
 * maioria que cada um assume a rotina por conta. Não é contradição a ser
 * resolvida escolhendo um lado: é a informação mais útil da tela, porque é
 * disso que a pessoa que entrar vai depender no primeiro mês.
 *
 * A Oficina Pantanal aparece com consulta insuficiente de propósito: duas
 * respostas não são "a equipe", e a tela precisa dizer isso em vez de tratar
 * duas pessoas como o conjunto.
 */
export const DEMO_CULTURE_ANSWERS: CultureAnswer[] = [
  // --- Cerrado Distribuição: gestão e equipe divergem no apoio inicial ---
  {
    id: 'CUL-01',
    companyId: 'EMP-01',
    axisId: 'apoio-inicial',
    optionId: 'troca-informal',
    respondent: 'gestao',
    count: 1,
    answeredAt: '2026-09-05'
  },
  {
    id: 'CUL-02',
    companyId: 'EMP-01',
    axisId: 'apoio-inicial',
    optionId: 'por-conta',
    respondent: 'equipe',
    count: 5,
    answeredAt: '2026-09-08'
  },
  {
    id: 'CUL-03',
    companyId: 'EMP-01',
    axisId: 'apoio-inicial',
    optionId: 'troca-informal',
    respondent: 'equipe',
    count: 2,
    answeredAt: '2026-09-08'
  },
  {
    id: 'CUL-04',
    companyId: 'EMP-01',
    axisId: 'comunicacao-prioridades',
    optionId: 'por-escrito',
    respondent: 'gestao',
    count: 1,
    answeredAt: '2026-09-05'
  },
  {
    id: 'CUL-05',
    companyId: 'EMP-01',
    axisId: 'comunicacao-prioridades',
    optionId: 'por-escrito',
    respondent: 'equipe',
    count: 6,
    answeredAt: '2026-09-08'
  },
  {
    id: 'CUL-06',
    companyId: 'EMP-01',
    axisId: 'comunicacao-prioridades',
    optionId: 'verbal-inicio',
    respondent: 'equipe',
    count: 1,
    answeredAt: '2026-09-08'
  },

  // --- Horizonte Alimentos: gestão, RH e equipe convergem ---
  {
    id: 'CUL-07',
    companyId: 'EMP-02',
    axisId: 'apoio-inicial',
    optionId: 'acompanhamento-formal',
    respondent: 'gestao',
    count: 1,
    answeredAt: '2026-09-02'
  },
  {
    id: 'CUL-08',
    companyId: 'EMP-02',
    axisId: 'apoio-inicial',
    optionId: 'acompanhamento-formal',
    respondent: 'rh',
    count: 1,
    answeredAt: '2026-09-02'
  },
  {
    id: 'CUL-09',
    companyId: 'EMP-02',
    axisId: 'apoio-inicial',
    optionId: 'acompanhamento-formal',
    respondent: 'equipe',
    count: 4,
    answeredAt: '2026-09-06'
  },

  // --- Oficina Pantanal: consulta à equipe sem base suficiente ---
  {
    id: 'CUL-10',
    companyId: 'EMP-03',
    axisId: 'autonomia',
    optionId: 'autonomia-ampla',
    respondent: 'gestao',
    count: 1,
    answeredAt: '2026-08-30'
  },
  {
    id: 'CUL-11',
    companyId: 'EMP-03',
    axisId: 'autonomia',
    optionId: 'parcial',
    respondent: 'equipe',
    count: 2,
    answeredAt: '2026-09-01'
  }
];
