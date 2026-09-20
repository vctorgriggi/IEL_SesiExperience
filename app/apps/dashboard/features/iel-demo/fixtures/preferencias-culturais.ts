import type { TalentCultureAnswer } from '../types';

/**
 * Cada alternativa aqui corresponde ao que a pessoa já declarou em
 * `preferences`, no texto dela; nenhuma acrescenta informação nova sobre
 * ninguém.
 *
 * Hugo fica de fora de propósito: não declarou preferência nenhuma, e a tela
 * precisa dizer isso em vez de plantá-lo no centro do plano.
 */
export const DEMO_TALENT_CULTURE_ANSWERS: TalentCultureAnswer[] = [
  // --- Ana: orientação no início, turno fixo, procedimento definido ---
  {
    id: 'CULT-ANA-01',
    talentId: 'ANA',
    axisId: 'lideranca-autonomia',
    value: 2,
    origin: 'Registro IEL — expectativa coletada em atendimento',
    sourceId: 'FONTE-IEL',
    updatedAt: '2026-08-18'
  },
  {
    id: 'CULT-ANA-02',
    talentId: 'ANA',
    axisId: 'execucao-ritmo',
    value: 4,
    origin: 'Currículo — informação declarada na inscrição',
    sourceId: 'FONTE-EMPREGARE',
    updatedAt: '2026-08-08'
  },
  {
    id: 'CULT-ANA-03',
    talentId: 'ANA',
    axisId: 'aprendizado-desenvolvimento',
    value: 3,
    origin: 'Registro IEL — expectativa coletada em atendimento',
    sourceId: 'FONTE-IEL',
    updatedAt: '2026-08-18'
  },
  {
    id: 'CULT-ANA-04',
    talentId: 'ANA',
    axisId: 'interacao-convivencia',
    value: 2,
    origin: 'Registro IEL — expectativa coletada em atendimento',
    sourceId: 'FONTE-IEL',
    updatedAt: '2026-08-18'
  },

  // --- Bruno: autonomia na execução, rotina já dominada ---
  {
    id: 'CULT-BRUNO-01',
    talentId: 'BRUNO',
    axisId: 'regras-decisao',
    value: 2,
    origin: 'Currículo — informação declarada na inscrição',
    sourceId: 'FONTE-EMPREGARE',
    updatedAt: '2026-08-11'
  },
  {
    id: 'CULT-BRUNO-02',
    talentId: 'BRUNO',
    axisId: 'execucao-ritmo',
    value: 3,
    origin: 'Currículo — informação declarada na inscrição',
    sourceId: 'FONTE-EMPREGARE',
    updatedAt: '2026-08-11'
  },
  {
    id: 'CULT-BRUNO-03',
    talentId: 'BRUNO',
    axisId: 'lideranca-autonomia',
    value: 4,
    origin: 'Currículo — informação declarada na inscrição',
    sourceId: 'FONTE-EMPREGARE',
    updatedAt: '2026-08-11'
  },
  {
    id: 'CULT-BRUNO-04',
    talentId: 'BRUNO',
    axisId: 'aprendizado-desenvolvimento',
    value: 2,
    origin: 'Currículo — informação declarada na inscrição',
    sourceId: 'FONTE-EMPREGARE',
    updatedAt: '2026-08-11'
  },

  // --- Carla: rotina administrativa, quer alcançar áreas vizinhas ---
  {
    id: 'CULT-CARLA-01',
    talentId: 'CARLA',
    axisId: 'aprendizado-desenvolvimento',
    value: 4,
    origin: 'Registro IEL — expectativa coletada em atendimento',
    sourceId: 'FONTE-IEL',
    updatedAt: '2026-08-03'
  },
  {
    id: 'CULT-CARLA-02',
    talentId: 'CARLA',
    axisId: 'lideranca-autonomia',
    value: 3,
    origin: 'Registro IEL — expectativa coletada em atendimento',
    sourceId: 'FONTE-IEL',
    updatedAt: '2026-08-03'
  },
  {
    id: 'CULT-CARLA-03',
    talentId: 'CARLA',
    axisId: 'interacao-convivencia',
    value: 3,
    origin: 'Registro IEL — expectativa coletada em atendimento',
    sourceId: 'FONTE-IEL',
    updatedAt: '2026-08-03'
  },
  {
    id: 'CULT-CARLA-04',
    talentId: 'CARLA',
    axisId: 'regras-decisao',
    value: 3,
    origin: 'Registro IEL — expectativa coletada em atendimento',
    sourceId: 'FONTE-IEL',
    updatedAt: '2026-08-03'
  },

  // --- Diego: respostas que não puxam para região nenhuma ---
  {
    id: 'CULT-DIEGO-01',
    talentId: 'DIEGO',
    axisId: 'aprendizado-desenvolvimento',
    value: 3,
    origin: 'Currículo — informação declarada na inscrição',
    sourceId: 'FONTE-EMPREGARE',
    updatedAt: '2026-07-21'
  },
  {
    id: 'CULT-DIEGO-02',
    talentId: 'DIEGO',
    axisId: 'regras-decisao',
    value: 3,
    origin: 'Currículo — informação declarada na inscrição',
    sourceId: 'FONTE-EMPREGARE',
    updatedAt: '2026-07-21'
  },
  {
    id: 'CULT-DIEGO-03',
    talentId: 'DIEGO',
    axisId: 'execucao-ritmo',
    value: 3,
    origin: 'Currículo — informação declarada na inscrição',
    sourceId: 'FONTE-EMPREGARE',
    updatedAt: '2026-07-21'
  },
  {
    id: 'CULT-DIEGO-04',
    talentId: 'DIEGO',
    axisId: 'lideranca-autonomia',
    value: 3,
    origin: 'Currículo — informação declarada na inscrição',
    sourceId: 'FONTE-EMPREGARE',
    updatedAt: '2026-07-21'
  },

  // --- Elisa: procedimento definido em todos os eixos ---
  {
    id: 'CULT-ELISA-01',
    talentId: 'ELISA',
    axisId: 'interacao-convivencia',
    value: 2,
    origin: 'Registro IEL — expectativa coletada em atendimento',
    sourceId: 'FONTE-IEL',
    updatedAt: '2026-08-26'
  },
  {
    id: 'CULT-ELISA-02',
    talentId: 'ELISA',
    axisId: 'aprendizado-desenvolvimento',
    value: 3,
    origin: 'Currículo — informação declarada na inscrição',
    sourceId: 'FONTE-EMPREGARE',
    updatedAt: '2026-08-07'
  },
  {
    id: 'CULT-ELISA-03',
    talentId: 'ELISA',
    axisId: 'regras-decisao',
    value: 4,
    origin: 'Registro IEL — expectativa coletada em atendimento',
    sourceId: 'FONTE-IEL',
    updatedAt: '2026-08-26'
  },
  {
    id: 'CULT-ELISA-04',
    talentId: 'ELISA',
    axisId: 'execucao-ritmo',
    value: 4,
    origin: 'Registro IEL — expectativa coletada em atendimento',
    sourceId: 'FONTE-IEL',
    updatedAt: '2026-08-26'
  },
  {
    id: 'CULT-ELISA-05',
    talentId: 'ELISA',
    axisId: 'lideranca-autonomia',
    value: 2,
    origin: 'Registro IEL — expectativa coletada em atendimento',
    sourceId: 'FONTE-IEL',
    updatedAt: '2026-08-26'
  },

  // --- Fábio: treinamento antes de assumir, primeira experiência na área ---
  {
    id: 'CULT-FABIO-01',
    talentId: 'FABIO',
    axisId: 'lideranca-autonomia',
    value: 2,
    origin: 'Registro IEL — expectativa coletada em atendimento',
    sourceId: 'FONTE-IEL',
    updatedAt: '2026-08-24'
  },
  {
    id: 'CULT-FABIO-02',
    talentId: 'FABIO',
    axisId: 'aprendizado-desenvolvimento',
    value: 4,
    origin: 'Registro IEL — expectativa coletada em atendimento',
    sourceId: 'FONTE-IEL',
    updatedAt: '2026-08-24'
  },
  {
    id: 'CULT-FABIO-03',
    talentId: 'FABIO',
    axisId: 'interacao-convivencia',
    value: 3,
    origin: 'Registro IEL — expectativa coletada em atendimento',
    sourceId: 'FONTE-IEL',
    updatedAt: '2026-08-24'
  },
  {
    id: 'CULT-FABIO-04',
    talentId: 'FABIO',
    axisId: 'regras-decisao',
    value: 3,
    origin: 'Registro IEL — expectativa coletada em atendimento',
    sourceId: 'FONTE-IEL',
    updatedAt: '2026-08-24'
  },

  // --- Gabriela: autonomia depois do início, prioridade por escrito ---
  {
    id: 'CULT-GABRIELA-01',
    talentId: 'GABRIELA',
    axisId: 'regras-decisao',
    value: 2,
    origin: 'Registro IEL — expectativa coletada em atendimento',
    sourceId: 'FONTE-IEL',
    updatedAt: '2026-08-28'
  },
  {
    id: 'CULT-GABRIELA-02',
    talentId: 'GABRIELA',
    axisId: 'interacao-convivencia',
    value: 2,
    origin: 'Registro IEL — expectativa coletada em atendimento',
    sourceId: 'FONTE-IEL',
    updatedAt: '2026-08-28'
  },
  {
    id: 'CULT-GABRIELA-03',
    talentId: 'GABRIELA',
    axisId: 'execucao-ritmo',
    value: 4,
    origin: 'Currículo — informação declarada na inscrição',
    sourceId: 'FONTE-EMPREGARE',
    updatedAt: '2026-08-16'
  },
  {
    id: 'CULT-GABRIELA-04',
    talentId: 'GABRIELA',
    axisId: 'lideranca-autonomia',
    value: 3,
    origin: 'Registro IEL — expectativa coletada em atendimento',
    sourceId: 'FONTE-IEL',
    updatedAt: '2026-08-28'
  },
  {
    id: 'CULT-GABRIELA-05',
    talentId: 'GABRIELA',
    axisId: 'aprendizado-desenvolvimento',
    value: 4,
    origin: 'Registro IEL — expectativa coletada em atendimento',
    sourceId: 'FONTE-IEL',
    updatedAt: '2026-08-28'
  }
];
