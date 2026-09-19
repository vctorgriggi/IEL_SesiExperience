import type { DemoState, HistoryEvent, Persona } from '../types';
import { DEMO_ANALYSIS, DEMO_APPLICATIONS } from './applications';
import { DEMO_CLARIFICATIONS } from './clarifications';
import {
  DEMO_COMPANIES,
  DEMO_DATA_SOURCES,
  DEMO_REFERENCE_DATE,
  DEMO_TEAMS
} from './companies';
import { DEMO_EVIDENCES } from './evidences';
import { DEMO_JOBS } from './jobs';
import { DEMO_ASSESSMENTS, DEMO_TALENTS } from './talents';

export const DEMO_SCHEMA_VERSION = 1;

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
      'Vê as vagas e candidaturas das empresas atendidas na base demo, conduz a análise e prepara encaminhamentos.',
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
    actor: 'Empregare — demonstração',
    action: 'Atualização recebida',
    description:
      'Vagas e candidaturas das três empresas atendidas foram atualizadas na base demo.',
    entityRef: null
  },
  {
    id: 'HIST-02',
    at: '2026-09-11T11:30:00.000Z',
    actor: 'Analista IEL',
    action: 'Esclarecimento solicitado',
    description:
      'Pergunta sobre a disponibilidade de Diego Alves enviada (simulada) para a candidatura da vaga Assistente de Logística.',
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
    applications: clone(DEMO_APPLICATIONS),
    analysis: clone(DEMO_ANALYSIS),
    evidences: clone(DEMO_EVIDENCES),
    teams: clone(DEMO_TEAMS),
    clarifications: clone(DEMO_CLARIFICATIONS),
    referrals: [],
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
export { DEMO_APPLICATIONS, DEMO_ANALYSIS } from './applications';
export { DEMO_CLARIFICATIONS } from './clarifications';
export {
  DEMO_COMPANIES,
  DEMO_DATA_SOURCES,
  DEMO_REFERENCE_DATE,
  DEMO_TEAMS
} from './companies';
export { DEMO_EVIDENCES } from './evidences';
export { DEMO_JOBS } from './jobs';
export { DEMO_ASSESSMENTS, DEMO_TALENTS } from './talents';
