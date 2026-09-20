import type { DemoState, HistoryEvent, Persona } from '../types';
import {
  DEMO_ACOMPANHAMENTO_APPLICATIONS,
  DEMO_ACOMPANHAMENTO_FIT_RESPONSES,
  DEMO_ACOMPANHAMENTO_TALENTS,
  DEMO_CHECK_INS,
  DEMO_REFERRALS
} from './acompanhamento';
import {
  DEMO_ANALYSIS,
  DEMO_APPLICATIONS,
  DEMO_FIT_RESPONSES
} from './applications';
import {
  ANALISE_REAL,
  CANDIDATURAS_REAIS,
  EVIDENCIAS_REAIS,
  PREFERENCIAS_CULTURAIS_REAIS,
  RESPOSTAS_FIT_REAIS,
  TALENTOS_REAIS
} from './candidatos-reais';
import { DEMO_CLARIFICATIONS } from './clarifications';
import {
  DEMO_COMPANIES,
  DEMO_DATA_SOURCES,
  DEMO_REFERENCE_DATE,
  DEMO_TEAMS
} from './companies';
import { DEMO_CULTURE_ANSWERS } from './culture';
import { DEMO_CULTURE_INVITES } from './culture-invites';
import {
  COMPETENCIAS_REAIS,
  CONVITES_REAIS,
  EMPRESAS_REAIS,
  EQUIPES_REAIS,
  RESPOSTAS_CULTURA_REAIS,
  VAGAS_REAIS
} from './empresas-reais';
import { DEMO_EVIDENCES } from './evidences';
import { getGeneratedBase } from './generated';
import { DEMO_JOBS } from './jobs';
import { DEMO_TALENT_CULTURE_ANSWERS } from './preferencias-culturais';
import { DEMO_ASSESSMENTS, DEMO_TALENTS } from './talents';

/*
 * 7: a resposta do candidato passou a ser da pessoa (`CandidateFitResponse`
 * ganhou `talentId`) e a valer 12 meses. O estado gravado na versão 6 é
 * descartado na leitura, e isso é a escolha certa, não uma conveniência:
 * aquelas respostas foram dadas sob um aceite que prometia o contrário do
 * reaproveitamento ("ficam ligadas a esta candidatura"). Carregá-las para
 * dentro da máquina de reuso seria exatamente o que decidimos não fazer.
 */
/**
 * Sobe a 8 com as competências escolhidas pela empresa
 * (`competenciasEscolhidas`, 20/09/2026): a chave nova muda o que a
 * aderência mede, então estado gravado na versão 7 é descartado em vez de
 * hidratar meio velho meio novo. Quem lê o campo ausente vê "as 11".
 */
export const DEMO_SCHEMA_VERSION = 8;

const GENERATED = getGeneratedBase();

/**
 * Catálogos completos: a base curada do roteiro primeiro, as empresas reais
 * de Cuiabá em seguida (`empresas-reais.ts`), o volume gerado por último. A
 * ordem importa — as telas listam nessa sequência, então as vagas e pessoas
 * da demonstração aparecem no topo sem depender de ordenação.
 */
export const ALL_COMPANIES = [
  ...DEMO_COMPANIES,
  ...EMPRESAS_REAIS,
  ...GENERATED.companies
];
export const ALL_JOBS = [...DEMO_JOBS, ...VAGAS_REAIS, ...GENERATED.jobs];
/**
 * As três pessoas da remessa antiga da Horizonte Alimentos entram depois das
 * curadas e antes do volume gerado: têm nome e história, mas não são as
 * protagonistas do roteiro (`fixtures/acompanhamento.ts`). Os candidatos das
 * empresas reais vêm depois delas (`candidatos-reais.ts`).
 */
export const ALL_TALENTS = [
  ...DEMO_TALENTS,
  ...DEMO_ACOMPANHAMENTO_TALENTS,
  ...TALENTOS_REAIS,
  ...GENERATED.talents
];

export const ALL_TALENT_CULTURE_ANSWERS = [
  ...DEMO_TALENT_CULTURE_ANSWERS,
  ...PREFERENCIAS_CULTURAIS_REAIS,
  ...GENERATED.talentCultureAnswers
];

/** Limite de candidatos numa comparação. */
export const COMPARISON_LIMIT = 3;

export const ANALYST_PERSONA_ID = 'analista-iel';

/**
 * Personas da barra "Visualizar como — demonstração". É um recorte de dados da
 * demonstração, não autenticação nem prova de segurança de produção.
 */
export const DEMO_PERSONAS: Persona[] = [
  {
    id: ANALYST_PERSONA_ID,
    kind: 'analista',
    label: 'Analista IEL',
    description:
      'Vê as vagas e candidaturas das empresas atendidas, conduz a análise e prepara encaminhamentos.',
    companyId: null,
    talentId: null
  },
  {
    id: 'gestor-emp-01',
    kind: 'gestor',
    label: 'Gestora — Cerrado Distribuição',
    description:
      'Marina Duarte. Vê apenas a própria empresa e os perfis compartilhados em encaminhamentos.',
    companyId: 'EMP-01',
    talentId: null
  },
  {
    id: 'gestor-emp-02',
    kind: 'gestor',
    label: 'Gestor — Horizonte Alimentos',
    description:
      'Rafael Nogueira. Vê apenas a própria empresa e os perfis compartilhados em encaminhamentos.',
    companyId: 'EMP-02',
    talentId: null
  },
  {
    id: 'gestor-emp-03',
    kind: 'gestor',
    label: 'Gestora — Oficina Pantanal',
    description:
      'Sônia Prado. Vê apenas a própria empresa e os perfis compartilhados em encaminhamentos.',
    companyId: 'EMP-03',
    talentId: null
  },
  {
    id: 'gestor-emp-04',
    kind: 'gestor',
    label: 'Gestão — Colatte',
    description:
      'Contato da empresa (sem nome na base). Vê apenas a própria empresa e os perfis compartilhados em encaminhamentos.',
    companyId: 'EMP-04',
    talentId: null
  }
];

/** Catálogo estático: a demonstração não altera estes registros. */
export const DEMO_CATALOG = {
  referenceDate: DEMO_REFERENCE_DATE,
  companies: DEMO_COMPANIES,
  jobs: DEMO_JOBS,
  talents: DEMO_TALENTS,
  assessments: DEMO_ASSESSMENTS,
  personas: DEMO_PERSONAS
} as const;

const INITIAL_HISTORY: HistoryEvent[] = [
  {
    id: 'HIST-01',
    at: '2026-09-13T18:20:00.000Z',
    actor: 'Empregare',
    action: 'Atualização recebida',
    description:
      'Vagas e candidaturas das três empresas atendidas foram atualizadas.',
    entityRef: null
  },
  {
    id: 'HIST-02',
    at: '2026-09-11T11:30:00.000Z',
    actor: 'Analista IEL',
    action: 'Esclarecimento solicitado',
    description:
      'Pergunta sobre a disponibilidade de Diego Alves enviada para a candidatura da vaga Assistente de Logística.',
    entityRef: 'ESC-02'
  },
  {
    id: 'HIST-03',
    at: '2026-09-10T13:00:00.000Z',
    actor: 'Analista IEL',
    action: 'Esclarecimento solicitado',
    description:
      'Reconfirmação de disponibilidade de Ana Ribeiro para a vaga Assistente de Estoque.',
    entityRef: 'ESC-01'
  }
];

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Estado inicial da demonstração. Sempre uma cópia: nada muta as fixtures. */
export function buildInitialDemoState(): DemoState {
  return {
    schemaVersion: DEMO_SCHEMA_VERSION,
    personaId: ANALYST_PERSONA_ID,
    dataSources: clone(DEMO_DATA_SOURCES),
    // As candidaturas das empresas reais vêm primeiro: a primeira da lista
    // é a do candidato da demonstração (CAND-21, Colatte), que é a que o
    // atalho "Ver como o candidato vê" abre (`candidatos-reais.ts`).
    applications: [
      ...clone(CANDIDATURAS_REAIS),
      ...clone(DEMO_APPLICATIONS),
      ...clone(DEMO_ACOMPANHAMENTO_APPLICATIONS),
      ...clone(GENERATED.applications)
    ],
    analysis: {
      ...clone(DEMO_ANALYSIS),
      ...clone(ANALISE_REAL),
      ...clone(GENERATED.analysis)
    },
    evidences: [
      ...clone(DEMO_EVIDENCES),
      ...clone(EVIDENCIAS_REAIS),
      ...clone(GENERATED.evidences)
    ],
    teams: [
      ...clone(DEMO_TEAMS),
      ...clone(EQUIPES_REAIS),
      ...clone(GENERATED.teams)
    ],
    cultureAnswers: [
      ...clone(DEMO_CULTURE_ANSWERS),
      ...clone(RESPOSTAS_CULTURA_REAIS),
      ...clone(GENERATED.cultureAnswers)
    ],
    cultureInvites: [...clone(DEMO_CULTURE_INVITES), ...clone(CONVITES_REAIS)],
    // A Colatte pede 8 das 11; as demais empresas não aparecem aqui, e
    // ausência quer dizer "as 11" (`competenciasDaEmpresa`).
    competenciasEscolhidas: clone(COMPETENCIAS_REAIS),
    importedTalents: [],
    spreadsheetImports: [],
    fitResponses: [
      ...clone(DEMO_FIT_RESPONSES),
      ...clone(DEMO_ACOMPANHAMENTO_FIT_RESPONSES),
      ...clone(RESPOSTAS_FIT_REAIS),
      ...clone(GENERATED.fitResponses)
    ],
    // A remessa da Horizonte Alimentos já contratada há semanas, e o que as
    // pessoas responderam desde então: sem isso, o acompanhamento só
    // existiria 30 dias depois de alguém clicar "contratei" ao vivo.
    checkIns: clone(DEMO_CHECK_INS),
    axisWeights: {},
    clarifications: clone(DEMO_CLARIFICATIONS),
    referrals: clone(DEMO_REFERRALS),
    history: clone(INITIAL_HISTORY),
    appliedSyncEventIds: [],
    comparison: {},
    referralList: {},
    ui: {
      jobsSearch: '',
      jobsCompanyId: 'todas',
      jobsStage: 'todas',
      overviewCompanyId: 'todas'
    }
  };
}

export {
  DEMO_CLARIFICATION_TEMPLATES,
  DEMO_SYNC_EVENTS,
  findClarificationTemplate
} from './clarifications';
export type { ClarificationTemplate } from './clarifications';
export {
  DEMO_APPLICATIONS,
  DEMO_ANALYSIS,
  DEMO_FIT_RESPONSES
} from './applications';
export { DEMO_CLARIFICATIONS } from './clarifications';
export {
  DEMO_COMPANIES,
  DEMO_DATA_SOURCES,
  DEMO_REFERENCE_DATE,
  DEMO_TEAMS
} from './companies';
export { DEMO_CULTURE_ANSWERS } from './culture';
export {
  DEMO_ACOMPANHAMENTO_APPLICATIONS,
  DEMO_ACOMPANHAMENTO_TALENTS,
  DEMO_CHECK_INS,
  DEMO_REFERRALS
} from './acompanhamento';
export { DEMO_TALENT_CULTURE_ANSWERS } from './preferencias-culturais';
export { DEMO_CULTURE_INVITES } from './culture-invites';
export {
  COMPETENCIAS_REAIS,
  CONVITES_REAIS,
  EMPRESAS_REAIS,
  EQUIPES_REAIS,
  RESPOSTAS_CULTURA_REAIS,
  VAGAS_REAIS
} from './empresas-reais';
export {
  ANALISE_REAL,
  CANDIDATURAS_REAIS,
  EVIDENCIAS_REAIS,
  RESPOSTAS_FIT_REAIS,
  TALENTOS_REAIS
} from './candidatos-reais';
export { loadExampleSpreadsheet } from './planilha-exemplo';
export { DEMO_EVIDENCES } from './evidences';
export { DEMO_JOBS } from './jobs';
export { DEMO_ASSESSMENTS, DEMO_TALENTS } from './talents';
