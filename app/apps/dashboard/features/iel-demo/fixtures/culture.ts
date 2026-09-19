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
  {
    id: 'CUL-17',
    companyId: 'EMP-01',
    axisId: 'aprendizado',
    optionId: 'rotina-propria',
    respondent: 'gestao',
    count: 1,
    answeredAt: '2026-09-05'
  },
  {
    id: 'CUL-18',
    companyId: 'EMP-01',
    axisId: 'aprendizado',
    optionId: 'rotina-propria',
    respondent: 'equipe',
    count: 3,
    answeredAt: '2026-09-08'
  },
  {
    id: 'CUL-19',
    companyId: 'EMP-01',
    axisId: 'aprendizado',
    optionId: 'processos-amplos',
    respondent: 'equipe',
    count: 1,
    answeredAt: '2026-09-08'
  },

  /*
   * Autonomia leva a Cerrado a quatro dos cinco eixos.
   *
   * Ela é a empresa que a tela abre por padrão, e com três eixos a aderência de
   * todo candidato saía calculada sobre três no máximo — parte deles sobre um
   * só, número que não sustenta posição em ranking.
   *
   * `ritmo-turno` fica de fora de propósito: é o eixo em que a proposta montada
   * a partir da descrição da vaga espera confirmação humana, e é essa lacuna
   * que a demonstração usa para mostrar que a análise não responde sozinha.
   * Preenchê-lo apagaria a cena.
   *
   * A divergência entre gestão e equipe continua onde a narrativa a colocou, no
   * apoio inicial: aqui os dois lados convergem, e a minoria da equipe aparece
   * como variação dentro do mesmo eixo, não como contradição.
   */
  {
    id: 'CUL-30',
    companyId: 'EMP-01',
    axisId: 'autonomia',
    optionId: 'rotina-definida',
    respondent: 'gestao',
    count: 1,
    answeredAt: '2026-09-05'
  },
  {
    id: 'CUL-31',
    companyId: 'EMP-01',
    axisId: 'autonomia',
    optionId: 'rotina-definida',
    respondent: 'equipe',
    count: 5,
    answeredAt: '2026-09-08'
  },
  {
    id: 'CUL-32',
    companyId: 'EMP-01',
    axisId: 'autonomia',
    optionId: 'parcial',
    respondent: 'equipe',
    count: 2,
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

  {
    id: 'CUL-20',
    companyId: 'EMP-02',
    axisId: 'autonomia',
    optionId: 'rotina-definida',
    respondent: 'gestao',
    count: 1,
    answeredAt: '2026-09-02'
  },
  {
    id: 'CUL-21',
    companyId: 'EMP-02',
    axisId: 'autonomia',
    optionId: 'rotina-definida',
    respondent: 'equipe',
    count: 4,
    answeredAt: '2026-09-06'
  },
  {
    id: 'CUL-22',
    companyId: 'EMP-02',
    axisId: 'ritmo-turno',
    optionId: 'fixo',
    respondent: 'gestao',
    count: 1,
    answeredAt: '2026-09-02'
  },
  {
    id: 'CUL-23',
    companyId: 'EMP-02',
    axisId: 'ritmo-turno',
    optionId: 'fixo',
    respondent: 'equipe',
    count: 5,
    answeredAt: '2026-09-06'
  },
  {
    id: 'CUL-24',
    companyId: 'EMP-02',
    axisId: 'aprendizado',
    optionId: 'rotina-propria',
    respondent: 'gestao',
    count: 1,
    answeredAt: '2026-09-02'
  },
  {
    id: 'CUL-25',
    companyId: 'EMP-02',
    axisId: 'aprendizado',
    optionId: 'rotina-propria',
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
  },
  {
    id: 'CUL-26',
    companyId: 'EMP-03',
    axisId: 'apoio-inicial',
    optionId: 'por-conta',
    respondent: 'gestao',
    count: 1,
    answeredAt: '2026-08-30'
  },
  {
    id: 'CUL-27',
    companyId: 'EMP-03',
    axisId: 'comunicacao-prioridades',
    optionId: 'ao-longo-do-dia',
    respondent: 'gestao',
    count: 1,
    answeredAt: '2026-08-30'
  },
  {
    id: 'CUL-28',
    companyId: 'EMP-03',
    axisId: 'ritmo-turno',
    optionId: 'variacao-frequente',
    respondent: 'gestao',
    count: 1,
    answeredAt: '2026-08-30'
  },
  {
    id: 'CUL-29',
    companyId: 'EMP-03',
    axisId: 'aprendizado',
    optionId: 'ja-domina',
    respondent: 'gestao',
    count: 1,
    answeredAt: '2026-08-30'
  }
];
