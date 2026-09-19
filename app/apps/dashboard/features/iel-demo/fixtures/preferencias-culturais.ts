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
    axisId: 'apoio-inicial',
    optionId: 'acompanhamento-formal',
    origin: 'Registro IEL — expectativa coletada em atendimento',
    sourceId: 'FONTE-IEL',
    updatedAt: '2026-08-12'
  },
  {
    id: 'CULT-ANA-02',
    talentId: 'ANA',
    axisId: 'ritmo-turno',
    optionId: 'fixo',
    origin: 'Currículo — informação declarada na inscrição',
    sourceId: 'FONTE-EMPREGARE',
    updatedAt: '2026-08-02'
  },
  {
    id: 'CULT-ANA-03',
    talentId: 'ANA',
    axisId: 'aprendizado',
    optionId: 'rotina-propria',
    origin: 'Registro IEL — expectativa coletada em atendimento',
    sourceId: 'FONTE-IEL',
    updatedAt: '2026-08-12'
  },
  {
    id: 'CULT-ANA-04',
    talentId: 'ANA',
    axisId: 'comunicacao-prioridades',
    optionId: 'por-escrito',
    origin: 'Registro IEL — expectativa coletada em atendimento',
    sourceId: 'FONTE-IEL',
    updatedAt: '2026-08-12'
  },

  // --- Bruno: autonomia na execução, rotina já dominada ---
  {
    id: 'CULT-BRUNO-01',
    talentId: 'BRUNO',
    axisId: 'autonomia',
    optionId: 'autonomia-ampla',
    origin: 'Currículo — informação declarada na inscrição',
    sourceId: 'FONTE-EMPREGARE',
    updatedAt: '2026-08-05'
  },
  {
    id: 'CULT-BRUNO-02',
    talentId: 'BRUNO',
    axisId: 'ritmo-turno',
    optionId: 'variacao-prevista',
    origin: 'Currículo — informação declarada na inscrição',
    sourceId: 'FONTE-EMPREGARE',
    updatedAt: '2026-08-05'
  },
  {
    id: 'CULT-BRUNO-03',
    talentId: 'BRUNO',
    axisId: 'apoio-inicial',
    optionId: 'por-conta',
    origin: 'Currículo — informação declarada na inscrição',
    sourceId: 'FONTE-EMPREGARE',
    updatedAt: '2026-08-05'
  },
  {
    id: 'CULT-BRUNO-04',
    talentId: 'BRUNO',
    axisId: 'aprendizado',
    optionId: 'ja-domina',
    origin: 'Currículo — informação declarada na inscrição',
    sourceId: 'FONTE-EMPREGARE',
    updatedAt: '2026-08-05'
  },

  // --- Carla: rotina administrativa, quer alcançar áreas vizinhas ---
  {
    id: 'CULT-CARLA-01',
    talentId: 'CARLA',
    axisId: 'aprendizado',
    optionId: 'processos-amplos',
    origin: 'Registro IEL — expectativa coletada em atendimento',
    sourceId: 'FONTE-IEL',
    updatedAt: '2026-07-28'
  },
  {
    id: 'CULT-CARLA-02',
    talentId: 'CARLA',
    axisId: 'apoio-inicial',
    optionId: 'troca-informal',
    origin: 'Registro IEL — expectativa coletada em atendimento',
    sourceId: 'FONTE-IEL',
    updatedAt: '2026-07-28'
  },
  {
    id: 'CULT-CARLA-03',
    talentId: 'CARLA',
    axisId: 'comunicacao-prioridades',
    optionId: 'verbal-inicio',
    origin: 'Registro IEL — expectativa coletada em atendimento',
    sourceId: 'FONTE-IEL',
    updatedAt: '2026-07-28'
  },
  {
    id: 'CULT-CARLA-04',
    talentId: 'CARLA',
    axisId: 'autonomia',
    optionId: 'parcial',
    origin: 'Registro IEL — expectativa coletada em atendimento',
    sourceId: 'FONTE-IEL',
    updatedAt: '2026-07-28'
  },

  // --- Diego: respostas que não puxam para região nenhuma ---
  {
    id: 'CULT-DIEGO-01',
    talentId: 'DIEGO',
    axisId: 'aprendizado',
    optionId: 'rotina-propria',
    origin: 'Currículo — informação declarada na inscrição',
    sourceId: 'FONTE-EMPREGARE',
    updatedAt: '2026-07-15'
  },
  {
    id: 'CULT-DIEGO-02',
    talentId: 'DIEGO',
    axisId: 'autonomia',
    optionId: 'parcial',
    origin: 'Currículo — informação declarada na inscrição',
    sourceId: 'FONTE-EMPREGARE',
    updatedAt: '2026-07-15'
  },
  {
    id: 'CULT-DIEGO-03',
    talentId: 'DIEGO',
    axisId: 'ritmo-turno',
    optionId: 'variacao-prevista',
    origin: 'Currículo — informação declarada na inscrição',
    sourceId: 'FONTE-EMPREGARE',
    updatedAt: '2026-07-15'
  },
  {
    id: 'CULT-DIEGO-04',
    talentId: 'DIEGO',
    axisId: 'apoio-inicial',
    optionId: 'troca-informal',
    origin: 'Currículo — informação declarada na inscrição',
    sourceId: 'FONTE-EMPREGARE',
    updatedAt: '2026-07-15'
  },

  // --- Elisa: procedimento definido em todos os eixos ---
  {
    id: 'CULT-ELISA-01',
    talentId: 'ELISA',
    axisId: 'comunicacao-prioridades',
    optionId: 'por-escrito',
    origin: 'Registro IEL — expectativa coletada em atendimento',
    sourceId: 'FONTE-IEL',
    updatedAt: '2026-08-20'
  },
  {
    id: 'CULT-ELISA-02',
    talentId: 'ELISA',
    axisId: 'aprendizado',
    optionId: 'rotina-propria',
    origin: 'Currículo — informação declarada na inscrição',
    sourceId: 'FONTE-EMPREGARE',
    updatedAt: '2026-08-01'
  },
  {
    id: 'CULT-ELISA-03',
    talentId: 'ELISA',
    axisId: 'autonomia',
    optionId: 'rotina-definida',
    origin: 'Registro IEL — expectativa coletada em atendimento',
    sourceId: 'FONTE-IEL',
    updatedAt: '2026-08-20'
  },
  {
    id: 'CULT-ELISA-04',
    talentId: 'ELISA',
    axisId: 'ritmo-turno',
    optionId: 'fixo',
    origin: 'Registro IEL — expectativa coletada em atendimento',
    sourceId: 'FONTE-IEL',
    updatedAt: '2026-08-20'
  },
  {
    id: 'CULT-ELISA-05',
    talentId: 'ELISA',
    axisId: 'apoio-inicial',
    optionId: 'acompanhamento-formal',
    origin: 'Registro IEL — expectativa coletada em atendimento',
    sourceId: 'FONTE-IEL',
    updatedAt: '2026-08-20'
  },

  // --- Fábio: treinamento antes de assumir, primeira experiência na área ---
  {
    id: 'CULT-FABIO-01',
    talentId: 'FABIO',
    axisId: 'apoio-inicial',
    optionId: 'acompanhamento-formal',
    origin: 'Registro IEL — expectativa coletada em atendimento',
    sourceId: 'FONTE-IEL',
    updatedAt: '2026-08-18'
  },
  {
    id: 'CULT-FABIO-02',
    talentId: 'FABIO',
    axisId: 'aprendizado',
    optionId: 'processos-amplos',
    origin: 'Registro IEL — expectativa coletada em atendimento',
    sourceId: 'FONTE-IEL',
    updatedAt: '2026-08-18'
  },
  {
    id: 'CULT-FABIO-03',
    talentId: 'FABIO',
    axisId: 'comunicacao-prioridades',
    optionId: 'verbal-inicio',
    origin: 'Registro IEL — expectativa coletada em atendimento',
    sourceId: 'FONTE-IEL',
    updatedAt: '2026-08-18'
  },
  {
    id: 'CULT-FABIO-04',
    talentId: 'FABIO',
    axisId: 'autonomia',
    optionId: 'parcial',
    origin: 'Registro IEL — expectativa coletada em atendimento',
    sourceId: 'FONTE-IEL',
    updatedAt: '2026-08-18'
  },

  // --- Gabriela: autonomia depois do início, prioridade por escrito ---
  {
    id: 'CULT-GABRIELA-01',
    talentId: 'GABRIELA',
    axisId: 'autonomia',
    optionId: 'autonomia-ampla',
    origin: 'Registro IEL — expectativa coletada em atendimento',
    sourceId: 'FONTE-IEL',
    updatedAt: '2026-08-22'
  },
  {
    id: 'CULT-GABRIELA-02',
    talentId: 'GABRIELA',
    axisId: 'comunicacao-prioridades',
    optionId: 'por-escrito',
    origin: 'Registro IEL — expectativa coletada em atendimento',
    sourceId: 'FONTE-IEL',
    updatedAt: '2026-08-22'
  },
  {
    id: 'CULT-GABRIELA-03',
    talentId: 'GABRIELA',
    axisId: 'ritmo-turno',
    optionId: 'fixo',
    origin: 'Currículo — informação declarada na inscrição',
    sourceId: 'FONTE-EMPREGARE',
    updatedAt: '2026-08-10'
  },
  {
    id: 'CULT-GABRIELA-04',
    talentId: 'GABRIELA',
    axisId: 'apoio-inicial',
    optionId: 'troca-informal',
    origin: 'Registro IEL — expectativa coletada em atendimento',
    sourceId: 'FONTE-IEL',
    updatedAt: '2026-08-22'
  },
  {
    id: 'CULT-GABRIELA-05',
    talentId: 'GABRIELA',
    axisId: 'aprendizado',
    optionId: 'processos-amplos',
    origin: 'Registro IEL — expectativa coletada em atendimento',
    sourceId: 'FONTE-IEL',
    updatedAt: '2026-08-22'
  }
];
